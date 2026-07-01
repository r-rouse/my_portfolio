/**
 * Chat Service — orchestrates retrieval and LLM generation.
 *
 * Architecture position:
 *   API route → Chat Service (this file) → Retrieval Service → OpenAI
 *
 * This layer owns the end-to-end answer pipeline. It does not know about HTTP
 * or React; callers pass a plain string and receive a plain string back.
 */

import { buildChatMessages } from './prompts';
import { createChatCompletion } from './openai';
import { retrieveContext } from '../rag/retrieveContext';

/**
 * Generates an assistant reply for a user question about Randall's portfolio.
 */
export async function generateAnswer(userMessage: string): Promise<string> {
  const context = await retrieveContext(userMessage);
  const messages = buildChatMessages(context, userMessage);
  return createChatCompletion(messages);
}
