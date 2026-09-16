import { test, expect } from '@playwright/test';
import { PgVectorStore } from '../../ai-rag/embeddings/pgvectorStore';
import { ProductionTextSplitter } from '../../ai-rag/chunking/textSplitter';
import { RagAgentWorkflow } from '../../ai-rag/graph/ragAgentGraph';

/**
 * SDET AI TEST SUITE: ENTERPRISE PGVECTOR (POSTGRESQL) VALIDATION
 * ------------------------------------------------------------------
 * Validates:
 * 1. PostgreSQL pgvector DDL generation (vector extension, table schema, GIN, HNSW/IVFFlat).
 * 2. All 3 distance operators: `<=>` (Cosine), `<->` (L2/Euclidean), `<#>` (Inner Product).
 * 3. Batch document upsert with ON CONFLICT (id) DO UPDATE.
 * 4. JSONB metadata pre-filtering (e.g. metadata->>'source').
 * 5. LangGraph agentic orchestrator execution powered by PgVectorStore backend.
 */

test.describe('AI RAG - Enterprise pgvector (PostgreSQL) Integration', () => {
  let pgStore: PgVectorStore;
  const splitter = new ProductionTextSplitter({ chunkSize: 160, chunkOverlap: 25 });

  const sampleKnowledgeBase = [
    {
      source: 'pg-orders.md',
      text: 'Standard domestic shipments are dispatched via express courier within 24 business hours of payment receipt.',
    },
    {
      source: 'pg-returns.md',
      text: 'Returns can be initiated within 30 days of delivery. Restocking fee of $5.99 is applied to non-defective returns.',
    },
    {
      source: 'pg-security.md',
      text: 'Multi-factor authentication (MFA) via TOTP hardware token or authenticator app is required for all privileged accounts.',
    },
  ];

  test.beforeEach(async () => {
    pgStore = new PgVectorStore({
      tableName: 'ecommerce_embeddings',
      dimensions: 128,
      distanceOperator: '<=>',
      indexType: 'hnsw',
      hnswOptions: { m: 16, efConstruction: 64 },
    });

    for (const doc of sampleKnowledgeBase) {
      const chunks = await splitter.splitText(doc.text, doc.source);
      await pgStore.addDocuments(chunks);
    }
  });

  test('PGVEC-01: generates valid PostgreSQL pgvector DDL schema and HNSW index', async () => {
    const ddl = await pgStore.initSchema();

    // 1. Extension creation
    expect(ddl[0]).toBe('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Table creation with vector column
    expect(ddl[1]).toContain('CREATE TABLE IF NOT EXISTS ecommerce_embeddings');
    expect(ddl[1]).toContain('embedding vector(128) NOT NULL');
    expect(ddl[1]).toContain('metadata JSONB NOT NULL');

    // 3. JSONB GIN index
    expect(ddl[2]).toContain('USING gin (metadata)');

    // 4. HNSW cosine index
    expect(ddl[3]).toContain('USING hnsw (embedding vector_cosine_ops)');
    expect(ddl[3]).toContain('m = 16, ef_construction = 64');
  });

  test('PGVEC-02: executes batch document upsert with ON CONFLICT DO UPDATE', async () => {
    const initialCount = await pgStore.count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Re-insert existing chunk to verify idempotent upsert
    const singleChunk = (await splitter.splitText('Updated return policy guidelines.', 'pg-returns.md'))[0];
    await pgStore.addDocuments([singleChunk]);

    const queries = pgStore.getExecutedQueries();
    const lastInsert = queries[queries.length - 1];
    expect(lastInsert).toContain('ON CONFLICT (id) DO UPDATE');
    expect(lastInsert).toContain('content = EXCLUDED.content');
  });

  test('PGVEC-03: performs cosine distance `<=>` similarity search with SQL generation', async () => {
    const results = await pgStore.similaritySearchWithScore('What is the restocking fee for returns?', 2);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.metadata.source).toBe('pg-returns.md');
    expect(results[0].chunk.content).toContain('Restocking fee');
    expect(results[0].score).toBeGreaterThan(0.35);

    // Verify generated SQL format
    const searchSql = pgStore.getLastSearchSql();
    expect(searchSql).toContain('1 - (embedding <=> ');
    expect(searchSql).toContain('ORDER BY embedding <=> ');
    expect(searchSql).toContain('LIMIT 2;');
  });

  test('PGVEC-04: supports all 3 pgvector distance operators (<=>, <->, <#>)', async () => {
    // 1. Cosine Distance `<=>`
    const cosineStore = new PgVectorStore({ distanceOperator: '<=>' });
    const chunkA = (await splitter.splitText('Refund policy details.', 'test'))[0];
    await cosineStore.addDocuments([chunkA]);
    const resCosine = await cosineStore.similaritySearchWithScore('Refund policy', 1);
    expect(cosineStore.getLastSearchSql()).toContain('<=>');
    expect(resCosine[0].score).toBeGreaterThan(0.4);

    // 2. Euclidean / L2 Distance `<->`
    const l2Store = new PgVectorStore({ distanceOperator: '<->' });
    await l2Store.addDocuments([chunkA]);
    const resL2 = await l2Store.similaritySearchWithScore('Refund policy', 1);
    expect(l2Store.getLastSearchSql()).toContain('<->');
    expect(resL2[0].score).toBeGreaterThan(0.0);

    // 3. Negative Inner Product `<#>`
    const ipStore = new PgVectorStore({ distanceOperator: '<#>' });
    await ipStore.addDocuments([chunkA]);
    const resIP = await ipStore.similaritySearchWithScore('Refund policy', 1);
    expect(ipStore.getLastSearchSql()).toContain('<#>');
    expect(resIP.length).toBe(1);
  });

  test('PGVEC-05: filters queries using JSONB metadata expressions', async () => {
    // Query with filter: only search inside 'pg-security.md'
    const results = await pgStore.similaritySearchWithScore('dispatched courier', 3, 0.0, {
      source: 'pg-security.md',
    });

    // Even though 'dispatched courier' is about shipping, filter forces security doc only
    results.forEach((r) => {
      expect(r.chunk.metadata.source).toBe('pg-security.md');
    });

    const searchSql = pgStore.getLastSearchSql();
    expect(searchSql).toContain("metadata->>'source' = 'pg-security.md'");
  });

  test('PGVEC-06: validates IVFFlat index generation with lists parameter', async () => {
    const ivfflatStore = new PgVectorStore({
      tableName: 'catalog_vectors',
      indexType: 'ivfflat',
      ivfflatOptions: { lists: 250 },
    });

    const ddl = await ivfflatStore.initSchema();
    const indexDdl = ddl.find((stmt) => stmt.includes('USING ivfflat'));
    expect(indexDdl).toBeDefined();
    expect(indexDdl).toContain('USING ivfflat (embedding vector_cosine_ops)');
    expect(indexDdl).toContain('lists = 250');
  });

  test('PGVEC-07: powers LangGraph StateGraph agent using pgvector backend', async () => {
    // Instantiate LangGraph workflow directly wired to pgStore!
    const agent = new RagAgentWorkflow(pgStore, { similarityThreshold: 0.35, topK: 2 });

    const query = 'How soon are domestic shipments dispatched?';
    const state = await agent.invoke(query);

    // Assert complete LangGraph state machine execution
    expect(state.guardrailPassed).toBe(true);
    expect(state.executionPath).toEqual(['guardrail', 'retrieve', 'generate', 'evaluateFaithfulness']);
    expect(state.status).toBe('completed');
    expect(state.answer).toContain('dispatched via express courier');
    expect(state.retrievedDocs[0].chunk.metadata.source).toBe('pg-orders.md');
  });
});
