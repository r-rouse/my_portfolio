/**
 * Document chunker — splits portfolio documents into retrievable units.
 *
 * Phase 1: chunks exist for structure only; all chunks are returned.
 * Phase 2: each chunk becomes an embedding-search candidate.
 */

import type { DocumentChunk, PortfolioDocument } from '../types/chat';

/**
 * Splits documents on markdown H2 headings so each section is a discrete chunk.
 * Files without headings become a single chunk.
 */
export function chunkDocuments(documents: PortfolioDocument[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  for (const doc of documents) {
    const sections = doc.content.split(/(?=^## )/m).filter((s) => s.trim());

    if (sections.length === 0) {
      chunks.push({
        id: `${doc.filename}-0`,
        source: doc.filename,
        content: doc.content.trim(),
      });
      continue;
    }

    sections.forEach((section, index) => {
      chunks.push({
        id: `${doc.filename}-${index}`,
        source: doc.filename,
        content: section.trim(),
      });
    });
  }

  // TODO: embeddings will be generated for each chunk and stored for similarity search

  return chunks;
}
