/**
 * Netlify Function — /api/analytics (production entry point for analytics).
 *
 * Wraps the Web-standard GET/POST handlers from app/api/analytics/route.ts.
 *
 * NOTE: Phase 1 storage is in-memory (see lib/analytics/analyticsStore.ts).
 * On Netlify, each Function instance has its own ephemeral memory and a
 * read-only filesystem, so analytics counts do not persist or aggregate
 * across invocations in production. Swap in a durable backend (Supabase,
 * Postgres, Redis, etc.) — the AnalyticsStorage interface already isolates
 * this change from the API and client instrumentation.
 */

import type { Config, Context } from '@netlify/functions';
import { GET, POST } from '../../app/api/analytics/route';

export default async function handler(
  request: Request,
  _context: Context
): Promise<Response> {
  if (request.method === 'GET') {
    return GET();
  }

  if (request.method === 'POST') {
    return POST(request);
  }

  return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export const config: Config = {
  path: '/api/analytics',
};
