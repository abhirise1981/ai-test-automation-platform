import { test, expect } from '@playwright/test';
import { AutonomousQePipeline } from '../../ai-rag/pipeline/pipeline';
import { PgVectorStore } from '../../ai-rag/embeddings/pgvectorStore';
import { ProductionTextSplitter } from '../../ai-rag/chunking/textSplitter';

/**
 * SDET TEST SUITE: AUTONOMOUS AI QE MULTI-AGENT PIPELINE
 * ------------------------------------------------------------------
 * Validates the full Jira -> Planner -> Generator -> Healer loop:
 * 1. Multi-agent state orchestration via LangGraph StateGraph.
 * 2. Official built-in tools from @langchain/core/tools.
 * 3. In-memory execution without touching the disk (Zero Disk Writes).
 * 4. Autonomous self-healing when locators break.
 */

test.describe('Autonomous AI QE Pipeline - LangGraph & In-Memory MCP Tools', () => {
  let pgStore: PgVectorStore;

  test.beforeEach(async () => {
    pgStore = new PgVectorStore({
      tableName: 'qe_domain_knowledge',
      dimensions: 128,
    });
    const splitter = new ProductionTextSplitter({ chunkSize: 200, chunkOverlap: 40 });
    const chunks = await splitter.splitText(
      'Order cancellation policy: orders can be cancelled within 24 hours of purchase.',
      'policy-cancellation.md'
    );
    await pgStore.addDocuments(chunks);
  });

  test('QE-PIPE-01: executes full happy path (Jira -> Planner -> Generator -> Executor: Passed)', async () => {
    const pipeline = new AutonomousQePipeline({
      vectorStore: pgStore,
      simulateFailureOnFirstRun: false,
    });

    const result = await pipeline.run('PROD-409');

    // 1. Assert full execution path
    expect(result.executionPath).toEqual(['planner', 'generator', 'executor']);
    expect(result.testStatus).toBe('passed');

    // 2. Assert Planner generated structured test plan
    expect(result.testPlan).not.toBeNull();
    expect(result.testPlan?.jiraKey).toBe('PROD-409');
    expect(result.testPlan?.testSteps.length).toBeGreaterThan(0);
    expect(result.acceptanceCriteria).toContain('Cancel Order');

    // 3. Assert Generator produced Playwright spec in-memory
    expect(result.generatedSpecCode).toContain("import { test, expect } from '@playwright/test'");
    expect(result.generatedSpecCode).toContain('button[data-testid="order-cancel-btn"]');

    // 4. Assert ZERO disk writes: All artifacts live in inMemoryArtifacts map
    expect(result.inMemoryArtifacts['specs/PROD-409.plan.md']).toBeDefined();
    expect(result.inMemoryArtifacts['tests/generated/PROD-409.spec.ts']).toBeDefined();
  });

  test('QE-PIPE-02: autonomously triggers Healer agent on failure and repairs selector in-memory', async () => {
    const pipeline = new AutonomousQePipeline({
      vectorStore: pgStore,
      simulateFailureOnFirstRun: true, // Injects broken selector to trigger Healer!
    });

    const result = await pipeline.run('PROD-410');

    // 1. Assert state machine routed: planner -> generator -> executor -> healer
    expect(result.executionPath).toEqual(['planner', 'generator', 'executor', 'healer']);
    expect(result.testStatus).toBe('healed');

    // 2. Assert Healer diagnosed and generated patch
    expect(result.healedPatch).not.toBeNull();
    expect(result.healedPatch?.brokenSelector).toBe('button.legacy-cancel-link');
    expect(result.healedPatch?.healedSelector).toBe('button[data-testid="order-cancel-btn"]');
    expect(result.healedPatch?.confidenceScore).toBeGreaterThanOrEqual(0.95);

    // 3. Assert code in memory was dynamically updated with the healed locator
    expect(result.generatedSpecCode).not.toContain('button.legacy-cancel-link');
    expect(result.generatedSpecCode).toContain('button[data-testid="order-cancel-btn"]');

    // 4. Assert repair diff was recorded in in-memory artifacts
    expect(result.inMemoryArtifacts['tests/healed/PROD-410.patch.diff']).toContain(
      '-button.legacy-cancel-link\n+button[data-testid="order-cancel-btn"]'
    );
  });
});
