import { test, expect } from '@playwright/test';
import { ProductionTextSplitter } from '../../ai-rag/chunking/textSplitter';

/**
 * SDET AI TEST SUITE: CHUNKING REGRESSION & BOUNDARY VALIDATION
 * ------------------------------------------------------------------
 * Validates document splitting strategies, token estimation, chunk overlap
 * continuity, and edge case resilience for RAG indexing.
 */

test.describe('AI RAG - Document Chunking Validation', () => {
  const sampleECommercePolicy = `
# Customer Return & Refund Policy

## 1. General Return Window
Customers may initiate a return for items purchased within 30 days of confirmed delivery.
All returned merchandise must be in original condition, including retail packaging and tags.

## 2. Non-Refundable Items
Certain categories are strictly non-refundable for hygiene and safety reasons:
- Perishable goods and beauty cosmetics
- Custom-engraved or personalized jewelry
- Digital downloadable software licenses and gift cards

## 3. Shipping & Restocking Fees
Standard return shipping is complimentary for defective or incorrect orders.
For remorse returns, a flat restocking fee of $5.99 will be deducted from the total refund amount.
Refunds are processed to the original payment method within 5 to 7 business days following inspection.

## 4. International Orders
International orders are subject to local customs clearance and duties.
Return shipping for international destinations must be arranged and covered by the buyer.
`.trim();

  test('CHUNK-01: splits document within targeted chunk size bounds', async () => {
    const splitter = new ProductionTextSplitter({ chunkSize: 200, chunkOverlap: 40 });
    const chunks = await splitter.splitText(sampleECommercePolicy, 'return-policy.md');

    expect(chunks.length).toBeGreaterThan(1);

    const stats = splitter.calculateStatistics(chunks);
    expect(stats.totalChunks).toBe(chunks.length);
    expect(stats.maxChunkLength).toBeLessThanOrEqual(250); // within separator tolerance
    expect(stats.avgChunkLength).toBeGreaterThan(50);
  });

  test('CHUNK-02: maintains overlap integrity across consecutive chunks', async () => {
    const wordStream =
      'Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliet Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey Xray Yankee Zulu';

    const splitter = new ProductionTextSplitter({ chunkSize: 50, chunkOverlap: 20, separators: [' '] });
    const chunks = await splitter.splitText(wordStream, 'alphabet-test');

    expect(chunks.length).toBeGreaterThan(1);
    const stats = splitter.calculateStatistics(chunks);
    expect(stats.totalChunks).toBe(chunks.length);

    // Verify overlap: consecutive chunks share common tokens
    for (let i = 0; i < chunks.length - 1; i++) {
      const currWords = chunks[i].content.split(/\s+/).filter(Boolean);
      const nextWords = chunks[i + 1].content.split(/\s+/).filter(Boolean);
      const common = currWords.filter((w) => nextWords.includes(w));
      expect(common.length, `Chunk ${i + 1} should share overlapping words with Chunk ${i}`).toBeGreaterThan(0);
    }
  });

  test('CHUNK-03: tracks accurate metadata, offsets, and token approximations', async () => {
    const splitter = new ProductionTextSplitter({ chunkSize: 200, chunkOverlap: 30 });
    const chunks = await splitter.splitText(sampleECommercePolicy, 'ecommerce-doc');

    chunks.forEach((chunk, index) => {
      expect(chunk.id).toBe(`ecommerce-doc-chunk-${index}`);
      expect(chunk.metadata.source).toBe('ecommerce-doc');
      expect(chunk.metadata.chunkIndex).toBe(index);
      expect(chunk.metadata.totalChunks).toBe(chunks.length);
      expect(chunk.metadata.endChar).toBeGreaterThan(chunk.metadata.startChar);
      expect(chunk.metadata.tokenEstimate).toBeGreaterThan(0);
    });
  });

  test('CHUNK-04: handles short document without unnecessary splits', async () => {
    const splitter = new ProductionTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
    const shortText = 'Free shipping applies to all domestic orders over $50.';
    const chunks = await splitter.splitText(shortText, 'short-notice');

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(shortText);
    expect(chunks[0].metadata.chunkIndex).toBe(0);
    expect(chunks[0].metadata.totalChunks).toBe(1);
  });

  test('CHUNK-05: gracefully handles empty text and whitespace inputs', async () => {
    const splitter = new ProductionTextSplitter();
    const emptyResult = await splitter.splitText('', 'empty');
    expect(emptyResult).toEqual([]);

    const whitespaceResult = await splitter.splitText('   \n\n\t  ', 'whitespace');
    expect(whitespaceResult).toEqual([]);
  });

  test('CHUNK-06: rejects invalid configuration where overlap exceeds or equals chunk size', () => {
    expect(() => {
      new ProductionTextSplitter({ chunkSize: 100, chunkOverlap: 100 });
    }).toThrow('chunkOverlap must be strictly smaller than chunkSize');

    expect(() => {
      new ProductionTextSplitter({ chunkSize: 100, chunkOverlap: 150 });
    }).toThrow('chunkOverlap must be strictly smaller than chunkSize');
  });
});
