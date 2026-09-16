import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { runGuardrails } from '../../ai-guardrails/lib/guard';
import { InMemoryVectorStore, ScoredChunk, VectorStore } from '../embeddings/vectorStore';
import { RagMetricsEvaluator } from '../evals/ragMetrics';

/**
 * LANGGRAPH STATEFUL AGENTIC RAG PIPELINE
 * ------------------------------------------------------------------
 * Implements an enterprise StateGraph orchestrator with:
 * 1. Typed State Schema using LangGraph Annotation.Root
 * 2. L1 Deterministic Security Guardrail intercept node
 * 3. Dense Vector Retrieval node with similarity thresholding
 * 4. Conditional Edge routing (Blocked vs Fallback vs Generate)
 * 5. Grounded Response Synthesis node
 * 6. Post-generation Faithfulness (hallucination) evaluation node
 * 7. Traceable execution path audit history for SDET state assertion
 */

export const RagAgentAnnotation = Annotation.Root({
  query: Annotation<string>(),
  guardrailPassed: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => true,
  }),
  guardrailReason: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  retrievedDocs: Annotation<ScoredChunk[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  topSimilarity: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  answer: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  faithfulnessScore: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 1.0,
  }),
  executionPath: Annotation<string[]>({
    reducer: (curr, update) => (curr || []).concat(update || []),
    default: () => [],
  }),
  status: Annotation<'pending' | 'blocked' | 'clarification_needed' | 'completed'>({
    reducer: (_, update) => update,
    default: () => 'pending',
  }),
});

export type RagAgentStateType = typeof RagAgentAnnotation.State;

export interface RagAgentOptions {
  similarityThreshold?: number;
  topK?: number;
}

export class RagAgentWorkflow {
  private vectorStore: VectorStore;
  private similarityThreshold: number;
  private topK: number;
  private app: any;

  constructor(vectorStore: VectorStore, options: RagAgentOptions = {}) {
    this.vectorStore = vectorStore;
    this.similarityThreshold = options.similarityThreshold ?? 0.35;
    this.topK = options.topK ?? 3;
    this.app = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph(RagAgentAnnotation)
      // Node 1: Guardrail verification
      .addNode('guardrail', (state) => {
        const guardResult = runGuardrails(state.query);
        if (!guardResult.allowed) {
          return {
            guardrailPassed: false,
            guardrailReason: guardResult.reason,
            answer: `Request rejected: Security guardrail violation (${guardResult.reason}).`,
            status: 'blocked' as const,
            executionPath: ['guardrail'],
          };
        }
        return {
          guardrailPassed: true,
          executionPath: ['guardrail'],
        };
      })

      // Node 2: Vector Retrieval
      .addNode('retrieve', async (state) => {
        const results = await this.vectorStore.similaritySearchWithScore(state.query, this.topK);
        const topScore = results.length > 0 ? results[0].score : 0;
        return {
          retrievedDocs: results,
          topSimilarity: topScore,
          executionPath: ['retrieve'],
        };
      })

      // Node 3: Grounded Answer Synthesis
      .addNode('generate', (state) => {
        const contextText = state.retrievedDocs.map((r) => r.chunk.content).join(' ');
        // Grounded answer generator: extracts relevant statements from retrieved context
        const answer = `Based on the verified documentation: ${contextText.slice(0, 300)}...`;
        return {
          answer,
          executionPath: ['generate'],
        };
      })

      // Node 4: Hallucination / Faithfulness Evaluation
      .addNode('evaluateFaithfulness', (state) => {
        const evalResult = RagMetricsEvaluator.evaluateFaithfulness(state.answer, state.retrievedDocs);
        return {
          faithfulnessScore: evalResult.faithfulnessScore,
          status: 'completed' as const,
          executionPath: ['evaluateFaithfulness'],
        };
      })

      // Node 5: Fallback node for out-of-domain / low confidence queries
      .addNode('fallbackClarification', () => {
        return {
          answer: 'I do not have sufficient verified information in the knowledge base to answer this query accurately.',
          status: 'clarification_needed' as const,
          faithfulnessScore: 1.0,
          executionPath: ['fallbackClarification'],
        };
      })

      // Edges and Conditional routing
      .addEdge(START, 'guardrail')
      .addConditionalEdges('guardrail', (state) => {
        return state.guardrailPassed ? 'retrieve' : END;
      })
      .addConditionalEdges('retrieve', (state) => {
        // If similarity is below threshold or no docs retrieved, route to fallback
        if (state.retrievedDocs.length === 0 || state.topSimilarity < this.similarityThreshold) {
          return 'fallbackClarification';
        }
        return 'generate';
      })
      .addEdge('generate', 'evaluateFaithfulness')
      .addEdge('evaluateFaithfulness', END)
      .addEdge('fallbackClarification', END);

    return workflow.compile();
  }

  /**
   * Invokes the compiled LangGraph workflow with full state tracking.
   */
  async invoke(query: string): Promise<RagAgentStateType> {
    return await this.app.invoke({
      query,
      executionPath: [],
    });
  }
}
