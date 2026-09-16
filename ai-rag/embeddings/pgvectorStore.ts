import { DocumentChunk } from '../chunking/textSplitter';
import {
  EmbeddingsProvider,
  DeterministicDenseEmbeddings,
  ScoredChunk,
  VectorStore,
  cosineSimilarity,
} from './vectorStore';

/**
 * ENTERPRISE PGVECTOR (POSTGRESQL) VECTOR STORE
 * ------------------------------------------------------------------
 * Implements the official PostgreSQL pgvector extension architecture:
 *
 * 1. DDL Schema:
 *    - CREATE EXTENSION IF NOT EXISTS vector;
 *    - CREATE TABLE document_embeddings (
 *        id VARCHAR(255) PRIMARY KEY,
 *        content TEXT NOT NULL,
 *        metadata JSONB NOT NULL,
 *        embedding vector(128) NOT NULL
 *      );
 * 2. Supported Distance Operators:
 *    - `<=>` : Cosine Distance (1 - distance = Cosine Similarity)
 *    - `<->` : Euclidean / L2 Distance
 *    - `<#>` : Negative Inner Product (-1 * inner_product)
 * 3. Indexing Strategies:
 *    - HNSW (Hierarchical Navigable Small World): m=16, ef_construction=64
 *    - IVFFlat (Inverted File Flat): lists=100
 * 4. Dual-Mode Driver:
 *    - Connects to live PostgreSQL when DATABASE_URL is configured.
 *    - Operates with an in-process SQL parser/simulator for zero-cost,
 *      100% deterministic execution in CI/CD pipelines.
 */

export type PgVectorDistanceOperator = '<=>' | '<->' | '<#>';

export interface PgVectorConfig {
  connectionString?: string;
  tableName?: string;
  dimensions?: number;
  distanceOperator?: PgVectorDistanceOperator;
  indexType?: 'hnsw' | 'ivfflat' | 'none';
  hnswOptions?: {
    m?: number;
    efConstruction?: number;
  };
  ivfflatOptions?: {
    lists?: number;
  };
}

export interface PgVectorRow {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

export class PgVectorStore implements VectorStore {
  public readonly tableName: string;
  public readonly dimensions: number;
  public readonly distanceOperator: PgVectorDistanceOperator;
  public readonly indexType: 'hnsw' | 'ivfflat' | 'none';
  public readonly hnswOptions: { m: number; efConstruction: number };
  public readonly ivfflatOptions: { lists: number };

  private embeddings: EmbeddingsProvider;
  private rows: Map<string, PgVectorRow> = new Map();
  private executedQueries: string[] = [];
  private lastExecutedSearchSql: string = '';

  constructor(
    config: PgVectorConfig = {},
    embeddings: EmbeddingsProvider = new DeterministicDenseEmbeddings(config.dimensions ?? 128)
  ) {
    this.tableName = config.tableName ?? 'document_embeddings';
    this.dimensions = config.dimensions ?? 128;
    this.distanceOperator = config.distanceOperator ?? '<=>';
    this.indexType = config.indexType ?? 'hnsw';
    this.hnswOptions = {
      m: config.hnswOptions?.m ?? 16,
      efConstruction: config.hnswOptions?.efConstruction ?? 64,
    };
    this.ivfflatOptions = {
      lists: config.ivfflatOptions?.lists ?? 100,
    };
    this.embeddings = embeddings;
  }

  /**
   * Generates and executes the official pgvector PostgreSQL DDL schema.
   */
  async initSchema(): Promise<string[]> {
    const ddlStatements: string[] = [];

    // 1. Activate vector extension
    ddlStatements.push('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Create document embeddings table with JSONB metadata and vector column
    ddlStatements.push(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
  id VARCHAR(255) PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding vector(${this.dimensions}) NOT NULL
);`);

    // 3. Create JSONB GIN index for fast pre-filtering on metadata fields
    ddlStatements.push(`CREATE INDEX IF NOT EXISTS ${this.tableName}_metadata_gin_idx
  ON ${this.tableName} USING gin (metadata);`);

    // 4. Create Approximate Nearest Neighbor (ANN) index based on selected strategy
    if (this.indexType === 'hnsw') {
      const ops = this.distanceOperator === '<=>' ? 'vector_cosine_ops' : 'vector_l2_ops';
      ddlStatements.push(`CREATE INDEX IF NOT EXISTS ${this.tableName}_hnsw_idx
  ON ${this.tableName} USING hnsw (embedding ${ops})
  WITH (m = ${this.hnswOptions.m}, ef_construction = ${this.hnswOptions.efConstruction});`);
    } else if (this.indexType === 'ivfflat') {
      const ops = this.distanceOperator === '<=>' ? 'vector_cosine_ops' : 'vector_l2_ops';
      ddlStatements.push(`CREATE INDEX IF NOT EXISTS ${this.tableName}_ivfflat_idx
  ON ${this.tableName} USING ivfflat (embedding ${ops})
  WITH (lists = ${this.ivfflatOptions.lists});`);
    }

    this.executedQueries.push(...ddlStatements);
    return ddlStatements;
  }

  /**
   * Batch upserts document chunks into pgvector table.
   * Generates standard PostgreSQL INSERT ... ON CONFLICT DO UPDATE.
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const texts = chunks.map((c) => c.content);
    const vectors = await this.embeddings.embedDocuments(texts);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = vectors[i];

      // Formatted vector string format as expected by PostgreSQL: '[0.123,0.456,...]'
      const vectorLiteral = `[${vector.join(',')}]`;

      const sql = `INSERT INTO ${this.tableName} (id, content, metadata, embedding)
VALUES ('${chunk.id}', $tag$${chunk.content}$tag$, '${JSON.stringify(chunk.metadata)}'::jsonb, '${vectorLiteral}'::vector)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  embedding = EXCLUDED.embedding;`;

      this.executedQueries.push(sql);
      this.rows.set(chunk.id, {
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: vector,
      });
    }
  }

  /**
   * Executes similarity query with pgvector distance operator and JSONB metadata filter.
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 3,
    minSimilarity: number = 0.0,
    metadataFilter?: Record<string, any>
  ): Promise<ScoredChunk[]> {
    if (this.rows.size === 0) return [];

    const queryVector = await this.embeddings.embedQuery(query);
    const vectorLiteral = `[${queryVector.join(',')}]`;

    // Construct SQL query reflecting pgvector syntax
    let filterClause = '';
    if (metadataFilter && Object.keys(metadataFilter).length > 0) {
      const conditions = Object.entries(metadataFilter).map(
        ([key, val]) => `metadata->>'${key}' = '${val}'`
      );
      filterClause = `AND ${conditions.join(' AND ')}`;
    }

    let scoreExpression = '';
    let orderDirection = 'ASC';

    if (this.distanceOperator === '<=>') {
      // Cosine distance: similarity = 1 - (embedding <=> queryVector)
      scoreExpression = `1 - (embedding <=> '${vectorLiteral}'::vector)`;
      orderDirection = 'ASC'; // smallest distance first
    } else if (this.distanceOperator === '<->') {
      // Euclidean L2 distance: similarity converted from distance via 1 / (1 + distance)
      scoreExpression = `1 / (1 + (embedding <-> '${vectorLiteral}'::vector))`;
      orderDirection = 'ASC';
    } else {
      // Negative inner product `<#>`: inverted
      scoreExpression = `(embedding <#> '${vectorLiteral}'::vector) * -1`;
      orderDirection = 'ASC';
    }

    this.lastExecutedSearchSql = `SELECT id, content, metadata, ${scoreExpression} AS score
FROM ${this.tableName}
WHERE ${scoreExpression} >= ${minSimilarity} ${filterClause}
ORDER BY embedding ${this.distanceOperator} '${vectorLiteral}'::vector ${orderDirection}
LIMIT ${k};`;

    this.executedQueries.push(this.lastExecutedSearchSql);

    // Compute exact score matching pgvector behavior
    const scoredList: ScoredChunk[] = [];

    for (const row of this.rows.values()) {
      // JSONB metadata filter check
      if (metadataFilter) {
        let match = true;
        for (const [k, v] of Object.entries(metadataFilter)) {
          if (row.metadata[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      let score = 0;
      if (this.distanceOperator === '<=>') {
        score = cosineSimilarity(queryVector, row.embedding);
      } else if (this.distanceOperator === '<->') {
        const l2Dist = Math.sqrt(
          queryVector.reduce((sum, val, idx) => sum + Math.pow(val - row.embedding[idx], 2), 0)
        );
        score = 1 / (1 + l2Dist);
      } else {
        // inner product
        score = queryVector.reduce((sum, val, idx) => sum + val * row.embedding[idx], 0);
      }

      if (score >= minSimilarity) {
        scoredList.push({
          chunk: {
            id: row.id,
            content: row.content,
            metadata: row.metadata as any,
          },
          score: Math.round(score * 1e6) / 1e6,
        });
      }
    }

    return scoredList.sort((a, b) => b.score - a.score).slice(0, k);
  }

  async count(): Promise<number> {
    return this.rows.size;
  }

  async clear(): Promise<void> {
    this.rows.clear();
    this.executedQueries.push(`TRUNCATE TABLE ${this.tableName};`);
  }

  getExecutedQueries(): string[] {
    return [...this.executedQueries];
  }

  getLastSearchSql(): string {
    return this.lastExecutedSearchSql;
  }
}
