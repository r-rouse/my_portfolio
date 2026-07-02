/**
 * Shared types for the chat pipeline.
 * Kept in a dedicated module so UI, API, and AI layers share one contract.
 */

/** Request body for POST /api/chat */
export interface ChatRequest {
  message: string;
}

/** Response body from POST /api/chat */
export interface ChatResponse {
  answer: string;
}

/** A single turn in the UI conversation history */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/** Raw markdown document loaded from the knowledge base */
export interface PortfolioDocument {
  filename: string;
  content: string;
}

/**
 * A retrievable unit of portfolio content.
 * Phase 1 returns all chunks; Phase 2 will select top-K via embedding search.
 */
export interface DocumentChunk {
  id: string;
  source: string;
  content: string;
  // TODO: embedding vector will be stored here after generation
}
