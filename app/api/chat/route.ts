/**
 * POST /api/chat — HTTP entry point for the portfolio assistant.
 *
 * Architecture position:
 *   UI → (fetch) → API route (this file) → Chat Service → Retrieval → OpenAI
 *
 * Written as a Web-standard Request/Response handler so it can be mounted by
 * any Node server (see server/dev-server.ts) or migrated to Next.js App Router
 * with minimal changes.
 */

import { generateAnswer } from '../../../lib/ai/chat';
import type { ChatRequest, ChatResponse } from '../../../lib/types/chat';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const answer = await generateAnswer(body.message.trim());
    const response: ChatResponse = { answer };

    return Response.json(response);
  } catch (error) {
    console.error('[POST /api/chat]', error);
    return Response.json(
      { error: 'Failed to generate a response' },
      { status: 500 }
    );
  }
}
