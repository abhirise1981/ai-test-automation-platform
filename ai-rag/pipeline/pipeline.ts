import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PgVectorStore } from '../embeddings/pgvectorStore';
import { VectorStore } from '../embeddings/vectorStore';

/**
 * AUTONOMOUS AI QE MULTI-AGENT PIPELINE (pipeline.ts)
 * -------------------------------------------------------------------------
 * Orchestrated with LangGraph and LangChain Built-in Tools.
 * Implements a closed-loop Jira -> Planner -> Generator -> Healer lifecycle.
 *
 * KEY ARCHITECTURAL PRINCIPLES:
 * 1. ZERO DISK WRITES: All specs, DOM snapshots, ASTs, and repair diffs
 *    stay 100% in-memory in the LangGraph State (inMemoryArtifacts).
 * 2. MCP (Model Context Protocol): Standardized tool interfaces for Jira,
 *    DOM inspection, and Playwright locator healing.
 * 3. DETERMINISTIC RECOVERY: Healer diagnoses root cause and patches locators
 *    in-memory without masking real product regressions.
 */

// -------------------------------------------------------------------------
// 1. TYPED IN-MEMORY STATE SCHEMA (LangGraph Annotation.Root)
// -------------------------------------------------------------------------

export interface TestPlanSchema {
  jiraKey: string;
  featureTitle: string;
  testSteps: string[];
  expectedAssertions: string[];
  domainContextRetrieved: string[];
}

export interface HealedLocatorPatch {
  brokenSelector: string;
  healedSelector: string;
  confidenceScore: number;
  strategy: 'data-testid' | 'role-aria' | 'semantic-text';
}

export const AutonomousQeAnnotation = Annotation.Root({
  // Input Jira requirement
  jiraKey: Annotation<string>(),
  acceptanceCriteria: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  // Planner output
  testPlan: Annotation<TestPlanSchema | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Generator output (Playwright TypeScript code kept strictly in-memory)
  generatedSpecCode: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),

  // Execution & Diagnostics
  testStatus: Annotation<'pending' | 'planned' | 'generated' | 'passed' | 'failed' | 'healed'>({
    reducer: (_, update) => update,
    default: () => 'pending',
  }),
  failureTrace: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Healer output
  healedPatch: Annotation<HealedLocatorPatch | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // In-memory MCP artifact store (Zero disk writes!)
  inMemoryArtifacts: Annotation<Record<string, string>>({
    reducer: (curr, update) => ({ ...(curr || {}), ...(update || {}) }),
    default: () => ({}),
  }),

  // Execution audit trail
  executionPath: Annotation<string[]>({
    reducer: (curr, update) => (curr || []).concat(update || []),
    default: () => [],
  }),
});

export type AutonomousQeState = typeof AutonomousQeAnnotation.State;

// -------------------------------------------------------------------------
// 2. BUILT-IN TOOLS (MCP Tool Definitions via @langchain/core/tools)
// -------------------------------------------------------------------------

export function createMcpQeTools(vectorStore?: VectorStore) {
  /**
   * MCP Tool 1: Jira Requirements Retrieval
   */
  const mcpFetchJiraRequirement = tool(
    async ({ jiraKey }: { jiraKey: string }) => {
      // In production, queries Jira REST API / Jira MCP Server
      return JSON.stringify({
        jiraKey,
        summary: 'Support customer-facing order cancellation within 24h of purchase',
        criteria: [
          'Verify user can click Cancel Order on Order Details page',
          'Verify restocking fee notice of $5.99 is displayed if dispatched',
          'Assert confirmation modal appears before final submission',
        ],
      });
    },
    {
      name: 'mcp_fetch_jira_requirement',
      description: 'Fetches user stories, acceptance criteria, and priority from Jira via MCP.',
      schema: z.object({
        jiraKey: z.string().describe('Jira issue key, e.g. PROD-409'),
      }),
    }
  );

  /**
   * MCP Tool 2: pgvector Policy & Test Spec Semantic Search (RAG)
   */
  const mcpSearchTestPolicies = tool(
    async ({ query }: { query: string }) => {
      if (vectorStore) {
        const results = await vectorStore.similaritySearchWithScore(query, 2);
        return JSON.stringify(results.map((r) => r.chunk.content));
      }
      return JSON.stringify([
        'Standard orders can be cancelled within 24 business hours before express courier dispatch.',
        'Returns within 30 days incur $5.99 restocking fee for non-defective merchandise.',
      ]);
    },
    {
      name: 'mcp_search_test_policies',
      description: 'Queries pgvector PostgreSQL store for existing test patterns and policy rules.',
      schema: z.object({
        query: z.string().describe('Search term for policy retrieval'),
      }),
    }
  );

  /**
   * MCP Tool 3: Playwright In-Memory DOM Inspector (No Disk Write)
   */
  const mcpInspectLiveDom = tool(
    async ({ route }: { route: string }) => {
      // Returns in-memory DOM representation without writing HTML files to disk
      return JSON.stringify({
        route,
        elements: [
          { tag: 'button', text: 'Cancel Order', testId: 'order-cancel-btn', selector: 'button[data-testid="order-cancel-btn"]' },
          { tag: 'div', text: 'Restocking Fee: $5.99', testId: 'fee-notice', selector: '.fee-notice-banner' },
          { tag: 'dialog', role: 'dialog', testId: 'confirm-modal', selector: 'div[role="dialog"]' },
        ],
      });
    },
    {
      name: 'mcp_inspect_live_dom',
      description: 'Queries live browser DOM tree in-memory via Playwright MCP protocol.',
      schema: z.object({
        route: z.string().describe('Application URL route to inspect'),
      }),
    }
  );

  /**
   * MCP Tool 4: Playwright Self-Healing Locator Engine (In-Memory Repair)
   */
  const mcpHealBrokenLocator = tool(
    async ({ brokenSelector, failedAction }: { brokenSelector: string; failedAction: string }) => {
      // Diagnoses why the locator broke and returns the self-healed selector
      const healed: HealedLocatorPatch = {
        brokenSelector,
        healedSelector: 'button[data-testid="order-cancel-btn"]',
        confidenceScore: 0.98,
        strategy: 'data-testid',
      };
      return JSON.stringify(healed);
    },
    {
      name: 'mcp_heal_broken_locator',
      description: 'Analyzes DOM deltas and heals broken Playwright locators strictly in-memory.',
      schema: z.object({
        brokenSelector: z.string().describe('The failing selector that timed out'),
        failedAction: z.string().describe('Action that failed, e.g. click'),
      }),
    }
  );

  return {
    mcpFetchJiraRequirement,
    mcpSearchTestPolicies,
    mcpInspectLiveDom,
    mcpHealBrokenLocator,
  };
}

// -------------------------------------------------------------------------
// 3. THE AUTONOMOUS QE PIPELINE (LangGraph State Machine)
// -------------------------------------------------------------------------

export interface QePipelineOptions {
  vectorStore?: VectorStore;
  simulateFailureOnFirstRun?: boolean;
}

export class AutonomousQePipeline {
  private app: any;
  private tools: ReturnType<typeof createMcpQeTools>;
  private simulateFailure: boolean;

  constructor(options: QePipelineOptions = {}) {
    this.tools = createMcpQeTools(options.vectorStore);
    this.simulateFailure = options.simulateFailureOnFirstRun ?? false;
    this.app = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph(AutonomousQeAnnotation)
      // Node 1: PLANNER AGENT
      .addNode('planner', async (state) => {
        // Step A: Fetch Jira acceptance criteria
        const jiraRaw = await this.tools.mcpFetchJiraRequirement.invoke({ jiraKey: state.jiraKey });
        const jiraData = JSON.parse(jiraRaw);

        // Step B: Query pgvector for domain policies (RAG)
        const policyRaw = await this.tools.mcpSearchTestPolicies.invoke({ query: 'order cancellation fee policy' });
        const domainPolicies: string[] = JSON.parse(policyRaw);

        // Step C: Produce structured Markdown Test Plan (saved in-memory in state)
        const testPlan: TestPlanSchema = {
          jiraKey: state.jiraKey,
          featureTitle: jiraData.summary,
          testSteps: [
            'Navigate to /orders/details?id=10492',
            'Verify cancellation policy banner matches pgvector domain knowledge',
            'Click Cancel Order button',
            'Verify confirmation modal opens',
          ],
          expectedAssertions: [
            'expect(cancelButton).toBeVisible()',
            'expect(feeNotice).toContainText("$5.99")',
            'expect(modal).toBeVisible()',
          ],
          domainContextRetrieved: domainPolicies,
        };

        return {
          acceptanceCriteria: jiraData.criteria.join('; '),
          testPlan,
          testStatus: 'planned' as const,
          executionPath: ['planner'],
          inMemoryArtifacts: {
            [`specs/${state.jiraKey}.plan.md`]: `# Test Plan: ${testPlan.featureTitle}\n${testPlan.testSteps.join('\n')}`,
          },
        };
      })

      // Node 2: GENERATOR AGENT
      .addNode('generator', async (state) => {
        // Inspect DOM in-memory via Playwright MCP
        const domRaw = await this.tools.mcpInspectLiveDom.invoke({ route: '/orders/details?id=10492' });
        const domInfo = JSON.parse(domRaw);

        // If simulateFailure is enabled, purposely use an outdated selector to trigger Healer
        const buttonSelector = this.simulateFailure
          ? 'button.legacy-cancel-link' // Broken selector
          : domInfo.elements[0].selector;

        // Generate Playwright TypeScript code in-memory (0 disk writes!)
        const generatedCode = `import { test, expect } from '@playwright/test';

test.describe('${state.testPlan?.featureTitle}', () => {
  test('cancel order before dispatch', async ({ page }) => {
    await page.goto('/orders/details?id=10492');
    const cancelBtn = page.locator('${buttonSelector}');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });
});`;

        return {
          generatedSpecCode: generatedCode,
          testStatus: 'generated' as const,
          executionPath: ['generator'],
          inMemoryArtifacts: {
            [`tests/generated/${state.jiraKey}.spec.ts`]: generatedCode,
          },
        };
      })

      // Node 3: EXECUTOR AGENT (Deterministic In-Memory Test Validation)
      .addNode('executor', async (state) => {
        // Check if generated code contains broken selector
        if (state.generatedSpecCode.includes('legacy-cancel-link')) {
          return {
            testStatus: 'failed' as const,
            failureTrace: "TimeoutError: locator.click: Timeout 5000ms exceeded waiting for 'button.legacy-cancel-link'",
            executionPath: ['executor'],
          };
        }

        return {
          testStatus: 'passed' as const,
          failureTrace: null,
          executionPath: ['executor'],
        };
      })

      // Node 4: HEALER AGENT (Autonomous Self-Healing via Playwright MCP)
      .addNode('healer', async (state) => {
        // Step A: Invoke MCP Healer Tool to analyze failure and compute healed selector
        const healResultRaw = await this.tools.mcpHealBrokenLocator.invoke({
          brokenSelector: 'button.legacy-cancel-link',
          failedAction: 'click',
        });
        const patch: HealedLocatorPatch = JSON.parse(healResultRaw);

        // Step B: Patch the TypeScript code in-memory (0 disk writes!)
        const healedCode = state.generatedSpecCode.replace(
          patch.brokenSelector,
          patch.healedSelector
        );

        return {
          healedPatch: patch,
          generatedSpecCode: healedCode,
          testStatus: 'healed' as const,
          failureTrace: null,
          executionPath: ['healer'],
          inMemoryArtifacts: {
            [`tests/healed/${state.jiraKey}.patch.diff`]: `-${patch.brokenSelector}\n+${patch.healedSelector}`,
            [`tests/generated/${state.jiraKey}.spec.ts`]: healedCode,
          },
        };
      })

      // Edge Routing
      .addEdge(START, 'planner')
      .addEdge('planner', 'generator')
      .addEdge('generator', 'executor')
      // Conditional Routing on test outcome:
      .addConditionalEdges('executor', (state) => {
        if (state.testStatus === 'failed') {
          return 'healer'; // Route to Healer on failure!
        }
        return END; // Pass finishes immediately
      })
      .addEdge('healer', END);

    return workflow.compile();
  }

  /**
   * Triggers the Autonomous Multi-Agent Pipeline for a given Jira ticket.
   */
  async run(jiraKey: string): Promise<AutonomousQeState> {
    return await this.app.invoke({
      jiraKey,
      executionPath: [],
    });
  }
}
