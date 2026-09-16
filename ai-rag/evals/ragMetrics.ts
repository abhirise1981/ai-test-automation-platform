import { ScoredChunk } from '../embeddings/vectorStore';

/**
 * SDET RAG EVALUATION METRICS (Ragas / DeepEval Aligned)
 * ------------------------------------------------------------------
 * Provides quantitative metrics to benchmark and assert RAG pipeline
 * quality, retrieval effectiveness, and hallucination bounds in automated tests.
 */

export interface RetrievalEvaluationResult {
  hitRate: number; // 0 or 1 for single query, 0.0 to 1.0 for batch
  mrr: number; // Mean Reciprocal Rank (0.0 to 1.0)
  contextPrecision: number;
}

export interface FaithfulnessEvaluationResult {
  isFaithful: boolean;
  faithfulnessScore: number; // 0.0 to 1.0 (proportion of answer claims supported by context)
  unsupportedClaims: string[];
}

export class RagMetricsEvaluator {
  /**
   * Evaluates Hit Rate @ K for a set of retrieved chunks against an expected chunk ID / source.
   * Returns 1 if expected chunk found in top K, else 0.
   */
  static evaluateHitRateAtK(retrieved: ScoredChunk[], expectedIdOrKeyword: string, k: number = 3): number {
    const topK = retrieved.slice(0, k);
    const found = topK.some(
      (item) =>
        item.chunk.id === expectedIdOrKeyword ||
        item.chunk.content.toLowerCase().includes(expectedIdOrKeyword.toLowerCase()) ||
        (item.chunk.metadata.source && item.chunk.metadata.source.includes(expectedIdOrKeyword))
    );
    return found ? 1 : 0;
  }

  /**
   * Computes Reciprocal Rank (RR) for a single query.
   * If the first relevant document is at rank 1 -> 1/1 = 1.0.
   * If at rank 2 -> 1/2 = 0.5. If not found -> 0.0.
   */
  static computeReciprocalRank(retrieved: ScoredChunk[], expectedKeyword: string): number {
    const term = expectedKeyword.toLowerCase();
    for (let i = 0; i < retrieved.length; i++) {
      const item = retrieved[i];
      const content = item.chunk.content.toLowerCase();
      const source = (item.chunk.metadata.source || '').toLowerCase();
      const id = item.chunk.id.toLowerCase();
      if (content.includes(term) || source.includes(term) || id.includes(term)) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  /**
   * Computes Mean Reciprocal Rank (MRR) across multiple query test cases.
   */
  static computeMRR(queryResults: Array<{ retrieved: ScoredChunk[]; expectedKeyword: string }>): number {
    if (queryResults.length === 0) return 0;
    const totalRR = queryResults.reduce(
      (sum, item) => sum + this.computeReciprocalRank(item.retrieved, item.expectedKeyword),
      0
    );
    return Math.round((totalRR / queryResults.length) * 1000) / 1000;
  }

  /**
   * Evaluates Faithfulness / Groundedness of a generated answer against context chunks.
   * Breaks the answer into atomic factual sentences/claims and verifies that
   * the claims have evidence in the context chunks (hallucination detection).
   */
  static evaluateFaithfulness(answer: string, contextChunks: ScoredChunk[]): FaithfulnessEvaluationResult {
    if (!answer || answer.trim().length === 0) {
      return { isFaithful: true, faithfulnessScore: 1.0, unsupportedClaims: [] };
    }

    const combinedContext = contextChunks
      .map((c) => c.chunk.content.toLowerCase())
      .join(' ');

    // Split answer into atomic sentences / assertions
    const sentences = answer
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (sentences.length === 0) {
      return { isFaithful: true, faithfulnessScore: 1.0, unsupportedClaims: [] };
    }

    const unsupportedClaims: string[] = [];

    for (const sentence of sentences) {
      // Extract key nouns/terms (length > 3, not common stop words)
      const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'were', 'which', 'about', 'there', 'their']);
      const keyTerms = sentence
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));

      if (keyTerms.length === 0) continue;

      // Check how many key terms appear in context
      const supportedTerms = keyTerms.filter((term) => combinedContext.includes(term));
      const termSupportRatio = supportedTerms.length / keyTerms.length;

      // If less than 40% of substantive terms in this sentence exist in context, flag as hallucination
      if (termSupportRatio < 0.4) {
        unsupportedClaims.push(sentence);
      }
    }

    const supportedCount = sentences.length - unsupportedClaims.length;
    const faithfulnessScore = Math.round((supportedCount / sentences.length) * 100) / 100;

    return {
      isFaithful: unsupportedClaims.length === 0,
      faithfulnessScore,
      unsupportedClaims,
    };
  }
}
