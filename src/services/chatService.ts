/**
 * Client-side Chat Service — the UI layer's only connection to the backend.
 *
 * Architecture position:
 *   UI components → Chat Service (this file) → POST /api/chat
 *
 * Components never call fetch directly; swap this module to change transport
 * (e.g., WebSocket streaming) without touching UI code.
 */

import type { ChatRequest, ChatResponse } from '../../lib/types/chat';

export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message } satisfies ChatRequest),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const detail =
      errorBody && typeof errorBody.error === 'string'
        ? errorBody.error
        : 'Something went wrong. Please try again.';
    throw new Error(detail);
  }

  const data = (await response.json()) as ChatResponse;
  return data.answer;
}
