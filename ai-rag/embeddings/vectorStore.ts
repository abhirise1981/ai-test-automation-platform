import { DocumentChunk } from '../chunking/textSplitter';

/**
 * PRODUCTION VECTOR EMBEDDING & VECTOR STORE ENGINE
 * ------------------------------------------------------------------
 * Handles vector embedding generation, L2 normalization, cosine similarity
 * computation, and semantic similarity search over indexed chunks.
 *
 * Designed with a pluggable architecture:
 * 1. DeterministicDenseEmbeddings (default) - High-dimensional (128-d)
 *    L2-normalized semantic vectorizer for CI/CD with 0 API cost and
 *    100% test reproducibility.
 * 2. Pluggable live provider (OpenAI / HuggingFace) when credentials exist.
 */

export interface EmbeddingsProvider {
  dimensions: number;
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

/**
 * Calculates mathematical Cosine Similarity between two vectors:
 * cos(u, v) = (u . v) / (||u|| * ||v||)
 * Range: -1 (opposite) to +1 (identical). Orthogonal vectors = 0.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Round to prevent floating point precision overflow (> 1.0000000001)
  return Math.min(1, Math.max(-1, Math.round(similarity * 1e6) / 1e6));
}

/**
 * Normalizes vector to unit length (L2 norm = 1).
 */
export function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec.map(() => 0);
  return vec.map((val) => val / norm);
}

/**
 * Deterministic dense semantic embedding model.
 * Maps lexical tokens and character tri-grams to a 128-dimensional dense
 * vector space with positional weighting and L2 normalization.
 */
export class DeterministicDenseEmbeddings implements EmbeddingsProvider {
  public readonly dimensions: number;

  constructor(dimensions: number = 128) {
    this.dimensions = dimensions;
  }

  private hashToken(token: string): number {
    let hash = 5381;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) + hash + token.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private static readonly STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'few', 'for', 'from', 'further',
    'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
    'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very',
    'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
    'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  private stem(token: string): string {
    return token
      .replace(/(ing|tion|ment|ness|able|ible)$/, '')
      .replace(/(es|s|ed)$/, '');
  }

  private vectorFromTokens(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const allTokens = cleaned.split(/\s+/).filter(Boolean);
    const tokens = allTokens.filter((t) => !DeterministicDenseEmbeddings.STOP_WORDS.has(t));

    if (tokens.length === 0) {
      return vector;
    }

    // 1. Stemmed content word token hashing with frequency weights
    for (const token of tokens) {
      const stemmed = this.stem(token);
      const bucket = this.hashToken(stemmed) % this.dimensions;
      vector[bucket] += 3.0;

      // 2. Character sub-word n-grams for morphological proximity
      for (let i = 0; i <= stemmed.length - 3; i++) {
        const trigram = stemmed.slice(i, i + 3);
        const triBucket = this.hashToken(trigram) % this.dimensions;
        vector[triBucket] += 0.5;
      }
    }

    return l2Normalize(vector);
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.vectorFromTokens(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.vectorFromTokens(t));
  }
}

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number; // Cosine similarity (0 to 1 for non-negative projections)
}

/**
 * Universal Vector Store contract for AI RAG retrievers.
 * Implemented by InMemoryVectorStore and PgVectorStore.
 */
export interface VectorStore {
  addDocuments(chunks: DocumentChunk[]): Promise<void>;
  similaritySearchWithScore(
    query: string,
    k?: number,
    minSimilarity?: number
  ): Promise<ScoredChunk[]>;
  count(): Promise<number> | number;
  clear(): Promise<void> | void;
}

/**
 * In-Memory Vector Store for RAG indexing and similarity retrieval.
 */
export class InMemoryVectorStore implements VectorStore {
  private embeddings: EmbeddingsProvider;
  private entries: Array<{ chunk: DocumentChunk; vector: number[] }> = [];

  constructor(embeddings: EmbeddingsProvider = new DeterministicDenseEmbeddings()) {
    this.embeddings = embeddings;
  }

  /**
   * Adds and embeds document chunks in the vector index.
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const texts = chunks.map((c) => c.content);
    const vectors = await this.embeddings.embedDocuments(texts);

    for (let i = 0; i < chunks.length; i++) {
      this.entries.push({
        chunk: chunks[i],
        vector: vectors[i],
      });
    }
  }

  /**
   * Performs cosine similarity search against indexed vectors.
   * Returns top-K results optionally filtered by a minimum similarity score.
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 3,
    minSimilarity: number = 0.0
  ): Promise<ScoredChunk[]> {
    if (this.entries.length === 0) return [];

    const queryVector = await this.embeddings.embedQuery(query);

    const scored = this.entries.map((entry) => {
      const score = cosineSimilarity(queryVector, entry.vector);
      return { chunk: entry.chunk, score };
    });

    return scored
      .filter((item) => item.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}
