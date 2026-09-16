import { test, expect } from '@playwright/test';
import {
  cosineSimilarity,
  l2Normalize,
  DeterministicDenseEmbeddings,
  InMemoryVectorStore,
} from '../../ai-rag/embeddings/vectorStore';
import { ProductionTextSplitter } from '../../ai-rag/chunking/textSplitter';
import { RagMetricsEvaluator } from '../../ai-rag/evals/ragMetrics';

/**
 * SDET AI TEST SUITE: VECTOR EMBEDDINGS & RETRIEVAL BENCHMARK
 * ------------------------------------------------------------------
 * Validates mathematical vector operations (Cosine Similarity, L2 norm),
 * dense embedding semantic proximity, top-K ranking, and retrieval
 * quality metrics (Hit Rate@K, MRR).
 */

test.describe('AI RAG - Vector Math & Embeddings Validation', () => {
  test('VEC-01: validates cosine similarity mathematical invariants', () => {
    // 1. Identical vectors -> similarity = 1.0
    const vecA = [0.6, 0.8];
    expect(cosineSimilarity(vecA, vecA)).toBeCloseTo(1.0, 5);

    // 2. Orthogonal vectors -> similarity = 0.0
    const vecOrthogonalA = [1, 0, 0];
    const vecOrthogonalB = [0, 1, 0];
    expect(cosineSimilarity(vecOrthogonalA, vecOrthogonalB)).toBe(0);

    // 3. Opposite vectors -> similarity = -1.0
    const vecPositive = [1, 2, 3];
    const vecNegative = [-1, -2, -3];
    expect(cosineSimilarity(vecPositive, vecNegative)).toBeCloseTo(-1.0, 5);

    // 4. Scale invariance: multiplying vector by 5 does not change angle/similarity
    const vecScaled = [3, 4];
    const vecScaled5x = [15, 20];
    expect(cosineSimilarity(vecScaled, vecScaled5x)).toBeCloseTo(1.0, 5);
  });

  test('VEC-02: throws error when comparing vectors of mismatched dimensions', () => {
    const vec3d = [1, 2, 3];
    const vec2d = [1, 2];
    expect(() => cosineSimilarity(vec3d, vec2d)).toThrow(/Vector dimension mismatch/);
  });

  test('VEC-03: enforces unit length via L2 normalization', () => {
    const rawVector = [3, 4]; // magnitude = sqrt(9 + 16) = 5
    const normalized = l2Normalize(rawVector);

    expect(normalized[0]).toBeCloseTo(0.6, 5);
    expect(normalized[1]).toBeCloseTo(0.8, 5);

    // Magnitude of normalized vector should be exactly 1.0
    const magnitude = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  test('VEC-04: verifies dense embedding dimensionality and semantic proximity', async () => {
    const embedder = new DeterministicDenseEmbeddings(128);
    expect(embedder.dimensions).toBe(128);

    const vecQuery = await embedder.embedQuery('return and refund policy');
    const vecSimilar = await embedder.embedQuery('customer returns and refunds');
    const vecUnrelated = await embedder.embedQuery('quantum physics thermodynamics');

    expect(vecQuery).toHaveLength(128);
    expect(vecSimilar).toHaveLength(128);
    expect(vecUnrelated).toHaveLength(128);

    const simRelated = cosineSimilarity(vecQuery, vecSimilar);
    const simUnrelated = cosineSimilarity(vecQuery, vecUnrelated);

    // Semantically related queries must have higher cosine similarity than unrelated ones
    expect(simRelated).toBeGreaterThan(simUnrelated);
    expect(simRelated).toBeGreaterThan(0.4);
  });
});

test.describe('AI RAG - Vector Store Retrieval & Benchmark (Hit Rate / MRR)', () => {
  let vectorStore: InMemoryVectorStore;

  test.beforeAll(async () => {
    vectorStore = new InMemoryVectorStore();
    const splitter = new ProductionTextSplitter({ chunkSize: 180, chunkOverlap: 30 });

    const knowledgeDocuments = [
      {
        source: 'shipping-policy.md',
        text: 'Standard domestic shipping delivers within 3 to 5 business days. Express next-day shipping is available for $14.99 on orders placed before 2 PM EST.',
      },
      {
        source: 'return-policy.md',
        text: 'Customers may initiate returns within 30 days of delivery. A flat restocking fee of $5.99 applies to remorse returns. Defective items receive full complimentary refunds.',
      },
      {
        source: 'security-auth.md',
        text: 'Two-factor authentication (2FA) is mandatory for administrator accounts. Session tokens expire after 15 minutes of inactivity and rotate on privilege elevation.',
      },
      {
        source: 'payment-methods.md',
        text: 'We accept Visa, MasterCard, American Express, Apple Pay, and PayPal. Cryptocurrency payments are not currently supported.',
      },
    ];

    for (const doc of knowledgeDocuments) {
      const chunks = await splitter.splitText(doc.text, doc.source);
      await vectorStore.addDocuments(chunks);
    }
  });

  test('RET-01: retrieves top-K relevant chunks ranked by cosine similarity', async () => {
    const results = await vectorStore.similaritySearchWithScore('What is the restocking fee for returns?', 2);

    expect(results.length).toBe(2);
    // Top result should be from return-policy
    expect(results[0].chunk.metadata.source).toBe('return-policy.md');
    expect(results[0].chunk.content).toContain('restocking fee');
    expect(results[0].score).toBeGreaterThan(0.35);
    // Ensure results are sorted in descending order of similarity
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  test('RET-02: filters out chunks below similarity threshold', async () => {
    const results = await vectorStore.similaritySearchWithScore('How do I return an item?', 5, 0.4);

    // All returned chunks must satisfy minimum similarity threshold
    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0.4);
    });
  });

  test('RET-03: SDET Benchmark - Evaluates Hit Rate @ 3 and Mean Reciprocal Rank (MRR)', async () => {
    const benchmarkSuite = [
      { query: 'How long does standard delivery take?', expectedKeyword: 'shipping-policy.md' },
      { query: 'What is the return window duration?', expectedKeyword: 'return-policy.md' },
      { query: 'Is two-factor authentication supported?', expectedKeyword: 'security-auth.md' },
      { query: 'Can I pay with Apple Pay?', expectedKeyword: 'payment-methods.md' },
    ];

    const evaluationResults = [];
    let hitsAt3 = 0;

    for (const testCase of benchmarkSuite) {
      const retrieved = await vectorStore.similaritySearchWithScore(testCase.query, 3);
      const hit = RagMetricsEvaluator.evaluateHitRateAtK(retrieved, testCase.expectedKeyword, 3);
      if (hit === 1) hitsAt3++;

      evaluationResults.push({
        retrieved,
        expectedKeyword: testCase.expectedKeyword,
      });
    }

    const hitRateAt3 = hitsAt3 / benchmarkSuite.length;
    const mrr = RagMetricsEvaluator.computeMRR(evaluationResults);

    // SDET Quality Gate Assertions
    expect(hitRateAt3, 'Hit Rate @ 3 should be at least 75%').toBeGreaterThanOrEqual(0.75);
    expect(mrr, 'MRR should be at least 0.65').toBeGreaterThanOrEqual(0.65);
  });
});
