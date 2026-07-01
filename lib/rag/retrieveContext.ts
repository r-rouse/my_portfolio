/**
 * Retrieval Service — selects relevant portfolio content for a user question.
 *
 * Architecture position:
 *   Chat Service → Retrieval Service (this file) → Knowledge Base
 *
 * Phase 1 (current): load all documents, chunk them, and return everything.
 * Phase 2 (future):
 *   User Question → Embedding Search → Top K Documents → LLM
 *
 * The function signature stays the same when upgrading to vector search.
 */

import { loadDocuments } from './loadDocuments';
import { chunkDocuments } from './chunkDocuments';

/**
 * Returns portfolio context text to inject into the LLM prompt.
 * @param query - User question; unused in Phase 1, required for Phase 2 embedding search
 */
export async function retrieveContext(query: string): Promise<string> {
  const documents = await loadDocuments();
  const chunks = chunkDocuments(documents);

  // TODO: convert query to an embedding vector
  // TODO: vector database will be used to find top K similar chunks
  // TODO: reranking can be added here to improve relevance before returning context
  void query;

  // Phase 1: return the full knowledge base as context
  const contextSections = chunks.map(
    (chunk) => `[Source: ${chunk.source}]\n${chunk.content}`
  );

  // TODO: citations can be returned alongside the answer using chunk.source metadata

  return contextSections.join('\n\n---\n\n');
}
