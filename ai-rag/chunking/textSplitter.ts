import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * PRODUCTION CHUNKING ENGINE
 * ------------------------------------------------------------------
 * Handles document tokenization and splitting into semantically coherent
 * chunks for downstream vector embedding and retrieval.
 *
 * Key Concepts:
 * - chunkSize: Target maximum character/token count per chunk.
 * - chunkOverlap: Trailing characters copied into next chunk to preserve
 *   cross-boundary semantic context (prevents splitting entities/clauses).
 * - separators: Hierarchical splitting order (paragraphs -> sentences -> words).
 */

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source?: string;
    chunkIndex: number;
    totalChunks?: number;
    startChar: number;
    endChar: number;
    tokenEstimate: number;
    [key: string]: any;
  };
}

export interface ChunkSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export interface ChunkStatistics {
  totalChunks: number;
  minChunkLength: number;
  maxChunkLength: number;
  avgChunkLength: number;
  hasOverlapViolation: boolean;
}

export class ProductionTextSplitter {
  private splitter: RecursiveCharacterTextSplitter;
  public readonly chunkSize: number;
  public readonly chunkOverlap: number;

  constructor(options: ChunkSplitterOptions = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 100;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('chunkOverlap must be strictly smaller than chunkSize');
    }

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: options.separators ?? ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  /**
   * Splits a raw document into structured DocumentChunk objects with
   * index tracking and character offset spans.
   */
  async splitText(text: string, source: string = 'unknown'): Promise<DocumentChunk[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const rawChunks = await this.splitter.splitText(text);
    const chunks: DocumentChunk[] = [];
    let searchOffset = 0;

    for (let i = 0; i < rawChunks.length; i++) {
      const content = rawChunks[i];
      const startChar = text.indexOf(content, searchOffset);
      const actualStart = startChar !== -1 ? startChar : searchOffset;
      const endChar = actualStart + content.length;
      searchOffset = Math.max(0, actualStart + Math.floor(content.length / 2));

      chunks.push({
        id: `${source}-chunk-${i}`,
        content,
        metadata: {
          source,
          chunkIndex: i,
          startChar: actualStart,
          endChar,
          // Approximation: ~4 chars per token in English
          tokenEstimate: Math.ceil(content.length / 4),
        },
      });
    }

    // Backfill totalChunks
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Computes audit metrics over a set of produced chunks.
   * Crucial for SDET automated chunking quality validation.
   */
  calculateStatistics(chunks: DocumentChunk[]): ChunkStatistics {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        minChunkLength: 0,
        maxChunkLength: 0,
        avgChunkLength: 0,
        hasOverlapViolation: false,
      };
    }

    const lengths = chunks.map((c) => c.content.length);
    const minChunkLength = Math.min(...lengths);
    const maxChunkLength = Math.max(...lengths);
    const avgChunkLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

    // Overlap validation: check that consecutive chunks retain shared substring
    let hasOverlapViolation = false;
    if (this.chunkOverlap > 0 && chunks.length > 1) {
      for (let i = 0; i < chunks.length - 1; i++) {
        const curr = chunks[i].content;
        const next = chunks[i + 1].content;
        // Verify that the end of `curr` shares some common prefix with `next`
        const currTail = curr.slice(-Math.min(this.chunkOverlap, curr.length));
        const foundCommon = next.includes(currTail.slice(-20)) || curr.includes(next.slice(0, 20));
        if (!foundCommon && curr.length >= this.chunkSize) {
          hasOverlapViolation = true;
          break;
        }
      }
    }

    return {
      totalChunks: chunks.length,
      minChunkLength,
      maxChunkLength,
      avgChunkLength,
      hasOverlapViolation,
    };
  }
}
