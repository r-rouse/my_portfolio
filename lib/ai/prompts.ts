/**
 * Prompt module — single source of truth for LLM instructions.
 * Swap or extend prompts here without touching retrieval or UI code.
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const SYSTEM_PROMPT = `You are Randall Rouse's portfolio assistant.

Answer using ONLY the supplied portfolio context as your source of truth.

You may reword, summarize, and reshape that information to fit the user's question naturally.
Do not copy the context word for word when a clearer paraphrase works better.

Never fabricate experience, employers, education, projects, technologies, or dates.

If the answer cannot be found in the supplied context, respond:

"I don't have that information in Randall's portfolio materials."

Keep answers concise and conversational.`;

/**
 * Builds the message array sent to OpenAI.
 * Context is injected as a separate user message so the system prompt stays stable.
 */
export function buildChatMessages(
  context: string,
  userMessage: string
): ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Portfolio context:\n\n${context}`,
    },
    { role: 'user', content: userMessage },
  ];
}
