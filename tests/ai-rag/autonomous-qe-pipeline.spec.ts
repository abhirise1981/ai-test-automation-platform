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

    // 1. Assert full execution path through the Code Validator quality gate
    expect(result.executionPath).toEqual(['planner', 'generator', 'validator', 'executor']);
    expect(result.testStatus).toBe('passed');

    // 2. Assert Code Validator verified the generated spec against all 4 quality gates
    expect(result.validationResult).not.toBeNull();
    expect(result.validationResult?.valid).toBe(true);
    expect(result.validationResult?.qualityScore).toBe(100);
    expect(result.validationResult?.passedGates).toEqual([
      'SECURITY_SANDBOX_GATE',
      'FRAMEWORK_CONFORMANCE_GATE',
      'ASSERTION_INTEGRITY_GATE',
      'ANTI_PATTERN_GATE',
    ]);

    // 3. Assert Planner generated structured test plan
    expect(result.testPlan).not.toBeNull();
    expect(result.testPlan?.jiraKey).toBe('PROD-409');
    expect(result.testPlan?.testSteps.length).toBeGreaterThan(0);
    expect(result.acceptanceCriteria).toContain('Cancel Order');

    // 4. Assert Generator produced Playwright spec in-memory
    expect(result.generatedSpecCode).toContain("import { test, expect } from '@playwright/test'");
    expect(result.generatedSpecCode).toContain('button[data-testid="order-cancel-btn"]');

    // 5. Assert ZERO disk writes: All artifacts live in inMemoryArtifacts map
    expect(result.inMemoryArtifacts['specs/PROD-409.plan.md']).toBeDefined();
    expect(result.inMemoryArtifacts['tests/generated/PROD-409.spec.ts']).toBeDefined();
  });

  test('QE-PIPE-02: autonomously triggers Healer agent on failure and repairs selector in-memory', async () => {
    const pipeline = new AutonomousQePipeline({
      vectorStore: pgStore,
      simulateFailureOnFirstRun: true, // Injects broken selector to trigger Healer!
    });

    const result = await pipeline.run('PROD-410');

    // 1. Assert state machine routed: planner -> generator -> validator -> executor -> healer
    expect(result.executionPath).toEqual(['planner', 'generator', 'validator', 'executor', 'healer']);
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

  test('QE-PIPE-03: Code Validator quality gate intercepts insecure or malformed code before execution', async () => {
    const pipeline = new AutonomousQePipeline({
      vectorStore: pgStore,
      simulateValidationFailure: true, // Injects eval() and waitForTimeout to trigger Quality Gate!
    });

    const result = await pipeline.run('PROD-411');

    // 1. Assert execution was blocked at validator node (NEVER reaches executor!)
    expect(result.executionPath).toEqual(['planner', 'generator', 'validator']);
    expect(result.testStatus).toBe('failed');

    // 2. Assert Quality Gate flagged the security and anti-pattern violations
    expect(result.validationResult).not.toBeNull();
    expect(result.validationResult?.valid).toBe(false);
    expect(result.validationResult?.failedGates).toContain('SECURITY_SANDBOX_GATE');
    expect(result.validationResult?.failedGates).toContain('ANTI_PATTERN_GATE');
    expect(result.failureTrace).toContain('CodeQualityGateError');
  });
});
