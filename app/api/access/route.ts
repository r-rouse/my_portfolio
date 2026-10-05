/**
 * POST /api/access — verify a content access code (bio / resume unlock).
 */

import { accessCodeConfigured, isAccessCodeValid } from '../../../lib/access/auth';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function clientId(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function rateLimited(id: string): boolean {
  const now = Date.now();
  const bucket = attempts.get(id);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

export async function POST(request: Request): Promise<Response> {
  if (rateLimited(clientId(request))) {
    return Response.json(
      { error: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!accessCodeConfigured()) {
    return Response.json(
      { error: 'Access code is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const body = (await request.json()) as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code || code.length > 128) {
      return Response.json(
        { error: 'Access code is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!isAccessCodeValid(code)) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { ok: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'Invalid request' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
