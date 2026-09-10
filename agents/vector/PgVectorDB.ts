/**
 * PgVectorDB.ts — PostgreSQL + pgvector Vector Database Engine
 *
 * Implements high-dimensional vector embeddings and cosine similarity search.
 * Connects to PostgreSQL + pgvector when PGVECTOR_URL is configured,
 * with an integrated in-memory fallback for local test suites.
 *
 * Used for:
 *   1. RAG Failure Retrieval & Self-Healing (HealerAgent)
 *   2. NL-to-SQL Schema Retrieval (NlToSqlAgent)
 *   3. Semantic DOM Element & Locator Healing
 */
import pg from 'pg';
import pgvector from 'pgvector/pg';

export interface VectorDocument<T = Record<string, any>> {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: T;
}

export interface VectorSearchResult<T = Record<string, any>> {
  document: VectorDocument<T>;
  similarity: number; // 0.0 to 1.0 (Cosine Similarity)
}

export class PgVectorDB {
  private documents: Map<string, VectorDocument> = new Map();
  private dimension: number;
  private tableName: string;
  private pool?: pg.Pool;

  constructor(dimension: number = 64, tableName: string = 'test_embeddings') {
    this.dimension = dimension;
    this.tableName = tableName;
    if (process.env.PGVECTOR_URL) {
      this.pool = new pg.Pool({ connectionString: process.env.PGVECTOR_URL });
    }
  }

  /**
   * Initialize pgvector extension and create embeddings table if pool is available.
   */
  public async initialize(): Promise<void> {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      await pgvector.registerType(client);
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          embedding vector(${this.dimension}),
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_embedding
        ON ${this.tableName} USING hnsw (embedding vector_cosine_ops)
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Generates a deterministic high-dimensional embedding vector for input text.
   * Compatible with 1536-dim OpenAI text-embedding-3-small or localized n-gram hashing.
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (process.env.OPENAI_API_KEY && this.dimension === 1536) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI();
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    }

    const vector: number[] = new Array(this.dimension).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter((t) => t.length > 1);

    if (tokens.length === 0) return vector;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 5381;
      for (let j = 0; j < token.length; j++) {
        hash = (hash * 33) ^ token.charCodeAt(j);
      }
      const index = Math.abs(hash) % this.dimension;
      vector[index] += 2.0;

      for (let k = 0; k <= token.length - 3; k++) {
        const trigram = token.substring(k, k + 3);
        let triHash = 5381;
        for (let l = 0; l < trigram.length; l++) {
          triHash = (triHash * 33) ^ trigram.charCodeAt(l);
        }
        const triIndex = Math.abs(triHash) % this.dimension;
        vector[triIndex] += 0.8;
      }
    }

    return this.normalize(vector);
  }

  /**
   * Add documents with embeddings into the vector store / pgvector table
   */
  public async addDocuments(docs: Array<{ id: string; text: string; metadata?: any }>): Promise<void> {
    for (const doc of docs) {
      const embedding = await this.generateEmbedding(doc.text);
      this.documents.set(doc.id, {
        id: doc.id,
        text: doc.text,
        embedding,
        metadata: doc.metadata || {},
      });

      if (this.pool) {
        try {
          const client = await this.pool.connect();
          try {
            await client.query(
              `INSERT INTO ${this.tableName} (id, text, embedding, metadata)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE SET text = $2, embedding = $3, metadata = $4`,
              [doc.id, doc.text, pgvector.toSql(embedding), JSON.stringify(doc.metadata || {})]
            );
          } finally {
            client.release();
          }
        } catch {
          // Fallback to in-memory store
        }
      }
    }
  }

  /**
   * Calculate Cosine Similarity: (A · B) / (||A|| * ||B||)
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dotProduct));
  }

  /**
   * Perform k-Nearest Neighbors (k-NN) Semantic Similarity Search
   */
  public async similaritySearch(query: string, topK: number = 3, minThreshold: number = 0.1): Promise<VectorSearchResult[]> {
    if (this.pool) {
      try {
        const queryEmbedding = await this.generateEmbedding(query);
        const client = await this.pool.connect();
        try {
          const result = await client.query(
            `SELECT id, text, metadata, 1 - (embedding <=> $1) AS similarity
             FROM ${this.tableName}
             WHERE 1 - (embedding <=> $1) >= $2
             ORDER BY embedding <=> $1
             LIMIT $3`,
            [pgvector.toSql(queryEmbedding), minThreshold, topK]
          );
          return result.rows.map((row: any) => ({
            document: { id: row.id, text: row.text, metadata: row.metadata },
            similarity: parseFloat(row.similarity),
          }));
        } finally {
          client.release();
        }
      } catch {
        // Fallback to memory
      }
    }

    const queryEmbedding = await this.generateEmbedding(query);
    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      if (score >= minThreshold) {
        results.push({ document: doc, similarity: score });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public clear(): void {
    this.documents.clear();
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  private normalize(vec: number[]): number[] {
    let norm = 0.0;
    for (const val of vec) norm += val * val;
    norm = Math.sqrt(norm);
    if (norm === 0) return vec;
    return vec.map((val) => val / norm);
  }
}

// Export alias for backward compatibility
export { PgVectorDB as VectorStore };
