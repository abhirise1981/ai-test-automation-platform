/**
 * nl-to-sql-vector.spec.ts — Vector Database, Embeddings & NL-to-SQL Test Suite
 *
 * Tests:
 *   1. Vector Store Embeddings & Cosine Similarity
 *   2. Semantic DOM Locator Healing via Vector Search
 *   3. RAG-Powered NL-to-SQL Schema Discovery & Query Generation
 *   4. SQL Injection Prevention & Read-Only Guardrails
 */

import { test, expect } from '@playwright/test';
import { VectorStore } from '../../agents/vector/VectorStore';
import { NlToSqlAgent, TableSchema } from '../../agents/sql/NlToSqlAgent';

test.describe('GenAI Vector Database, Embeddings & NL-to-SQL Suite', () => {
  let vectorStore: VectorStore;
  let nlToSqlAgent: NlToSqlAgent;

  test.beforeEach(async () => {
    vectorStore = new VectorStore(64);
    nlToSqlAgent = new NlToSqlAgent(vectorStore);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. VECTOR STORE & EMBEDDINGS TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Vector Embeddings & Cosine Similarity', () => {
    test('TC-VEC-01: Should compute normalized embedding vectors and cosine similarity', async () => {
      const vecA = await vectorStore.generateEmbedding('Clinical AI Transcription Doctor Dashboard');
      const vecB = await vectorStore.generateEmbedding('Clinical AI Transcription Provider Portal');
      const vecC = await vectorStore.generateEmbedding('Automotive Car Repair Engine Diagnostics');

      expect(vecA.length).toBe(64);
      expect(vecB.length).toBe(64);

      // Semantic similarity between clinical AI phrases should be high
      const similarityClinical = vectorStore.cosineSimilarity(vecA, vecB);
      // Semantic similarity between clinical AI and automotive should be low
      const similarityUnrelated = vectorStore.cosineSimilarity(vecA, vecC);

      expect(similarityClinical).toBeGreaterThan(0.6);
      expect(similarityClinical).toBeGreaterThan(similarityUnrelated);
    });

    test('TC-VEC-02: Should perform semantic DOM element retrieval for self-healing locators', async () => {
      await vectorStore.addDocuments([
        { id: 'btn_1', text: 'button#btn-upgrade-pro: Upgrade to Clinical AI Pro Subscription' },
        { id: 'btn_2', text: 'button#btn-cancel-sub: Cancel SaaS Plan' },
        { id: 'btn_3', text: 'input#search-patients: Search Longitudinal Patient Medical Records' },
      ]);

      const query = 'Find button to upgrade clinical pro plan';
      const results = await vectorStore.similaritySearch(query, 1);

      expect(results.length).toBe(1);
      expect(results[0].document.id).toBe('btn_1');
      expect(results[0].document.text).toContain('btn-upgrade-pro');
      expect(results[0].similarity).toBeGreaterThan(0.5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. NL-TO-SQL & SCHEMA RAG TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('NL-to-SQL Translation & Schema RAG', () => {
    test.beforeEach(async () => {
      const clinicalSchemas: TableSchema[] = [
        {
          tableName: 'doctors',
          description: 'Physicians, doctors, clinicians, and medical practitioners',
          columns: [
            { name: 'id', type: 'UUID', isPrimary: true },
            { name: 'name', type: 'VARCHAR(255)' },
            { name: 'specialty', type: 'VARCHAR(100)' },
          ],
        },
        {
          tableName: 'subscriptions',
          description: 'SaaS subscription tiers, active status, billing cycle, Clinical AI Pro plans',
          columns: [
            { name: 'id', type: 'UUID', isPrimary: true },
            { name: 'doctor_id', type: 'UUID', isForeign: true, references: 'doctors.id' },
            { name: 'tier', type: 'VARCHAR(50)' },
            { name: 'status', type: 'VARCHAR(20)' },
          ],
        },
        {
          tableName: 'payments',
          description: 'Stripe transaction records, invoice amount, payment intents, successful charges in cents',
          columns: [
            { name: 'id', type: 'UUID', isPrimary: true },
            { name: 'subscription_id', type: 'UUID', isForeign: true, references: 'subscriptions.id' },
            { name: 'amount_cents', type: 'INTEGER' },
            { name: 'status', type: 'VARCHAR(20)' },
          ],
        },
      ];

      await nlToSqlAgent.registerSchemas(clinicalSchemas);
    });

    test('TC-SQL-01: Should translate Natural Language assertion to verified SQL query via Schema RAG', async () => {
      const nlQuery = 'Verify doctor John Doe has active subscription and paid amount of $499 invoice';
      const result = await nlToSqlAgent.translateNlToSql(nlQuery);

      expect(result.isSafe).toBe(true);
      expect(result.relevantTables).toContain('doctors');
      expect(result.relevantTables).toContain('subscriptions');
      expect(result.generatedSql).toContain('SELECT d.id AS doctor_id');
      expect(result.generatedSql).toContain('JOIN subscriptions s');
      expect(result.generatedSql).toContain("status = 'active'");
      expect(result.generatedSql).toContain("d.name ILIKE '%John Doe%'");
    });

    test('TC-SQL-02: Should enforce SQL safety guardrails and reject destructive DDL/DML statements', async () => {
      const safeQuery = "SELECT id, name FROM doctors WHERE status = 'active';";
      const unsafeDrop = 'DROP TABLE doctors;--';
      const unsafeTruncate = 'TRUNCATE TABLE subscriptions;';
      const unsafeDelete = "DELETE FROM payments WHERE status = 'failed';";

      expect(nlToSqlAgent.validateSqlSafety(safeQuery)).toBe(true);
      expect(nlToSqlAgent.validateSqlSafety(unsafeDrop)).toBe(false);
      expect(nlToSqlAgent.validateSqlSafety(unsafeTruncate)).toBe(false);
      expect(nlToSqlAgent.validateSqlSafety(unsafeDelete)).toBe(false);
    });
  });
});
