/**
 * OpenAI adapter — isolates the LLM provider behind a small interface.
 * Replace this module to swap providers without changing chat or retrieval logic.
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Sends a completion request and returns the assistant's text reply.
 */
export async function createChatCompletion(
  messages: ChatCompletionMessageParam[]
): Promise<string> {
  const openai = getClient();

  // TODO: streaming responses can be implemented here using openai.chat.completions.stream
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages,
    temperature: 0.2,
  });

  return (
    response.choices[0]?.message?.content?.trim() ??
    "I don't have that information in Randall's portfolio materials."
  );
}
