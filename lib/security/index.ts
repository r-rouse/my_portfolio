/**
 * Shared API security guards: rate limits + common response headers.
 */

import { checkRateLimit, rateLimitHeaders, type RateLimitConfig } from './rateLimit';
import { getClientId, jsonError } from './request';

export const RATE_LIMITS = {
  chatPost: { key: 'chat:POST', limit: 10, windowMs: 60_000 },
  analyticsPost: { key: 'analytics:POST', limit: 60, windowMs: 60_000 },
  analyticsGet: { key: 'analytics:GET', limit: 30, windowMs: 60_000 },
  journalGet: { key: 'journal:GET', limit: 60, windowMs: 60_000 },
  journalPost: { key: 'journal:POST', limit: 10, windowMs: 60_000 },
  journalDelete: { key: 'journal:DELETE', limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export const BODY_LIMITS = {
  chat: 4_096,
  analytics: 8_192,
  journal: 65_536,
} as const;

export const FIELD_LIMITS = {
  chatMessage: 2_000,
  journalBody: 50_000,
  analyticsPath: 200,
  analyticsSessionId: 128,
  analyticsMetadataKey: 64,
  analyticsMetadataValue: 200,
  journalFilename: 180,
} as const;

export function enforceRateLimit(
  request: Request,
  config: RateLimitConfig
): Response | null {
  const result = checkRateLimit(getClientId(request), config);
  if (result.allowed) {
    return null;
  }

  return jsonError('Too many requests. Please try again later.', 429, {
    ...rateLimitHeaders(result),
  });
}

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cache-Control', headers.get('Cache-Control') ?? 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function guardApiRequest(
  request: Request,
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const limited = enforceRateLimit(request, config);
  if (limited) {
    return withSecurityHeaders(limited);
  }

  try {
    return withSecurityHeaders(await handler());
  } catch (error) {
    console.error('[api guard]', error);
    return withSecurityHeaders(jsonError('Internal server error', 500));
  }
}
