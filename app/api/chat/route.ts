/**
 * POST /api/chat — HTTP entry point for the portfolio assistant.
 *
 * Architecture position:
 *   UI → (fetch) → API route (this file) → Chat Service → Retrieval → OpenAI
 *
 * Hardened with rate limits, body size caps, and message length validation.
 */

import { generateAnswer } from '../../../lib/ai/chat';
import {
  BODY_LIMITS,
  FIELD_LIMITS,
  RATE_LIMITS,
  guardApiRequest,
} from '../../../lib/security';
import { clampString, jsonError, readJsonBody } from '../../../lib/security/request';
import type { ChatResponse } from '../../../lib/types/chat';

export async function POST(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.chatPost, async () => {
    const parsed = await readJsonBody<{ message?: unknown }>(
      request,
      BODY_LIMITS.chat
    );
    if (!parsed.ok) return parsed.response;

    const message = clampString(parsed.value.message, FIELD_LIMITS.chatMessage);
    if (!message) {
      return jsonError(
        `Message is required and must be at most ${FIELD_LIMITS.chatMessage} characters`,
        400
      );
    }

    try {
      const answer = await generateAnswer(message);
      const response: ChatResponse = { answer };
      return Response.json(response);
    } catch (error) {
      console.error('[POST /api/chat]', error);
      return jsonError('Failed to generate a response', 500);
    }
  });
}
