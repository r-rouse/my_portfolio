/**
 * Lightweight in-memory rate limiter for API routes.
 *
 * Best-effort on serverless (per-instance). Still blocks burst abuse from a
 * single client hitting the same function instance.
 */

export interface RateLimitConfig {
  /** Unique bucket key, e.g. "chat:POST". */
  key: string;
  /** Max requests in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function prune(now: number): void {
  if (buckets.size < 2_000) return;
  for (const [id, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(id);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucketId = `${config.key}:${clientId}`;
  const existing = buckets.get(bucketId);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketId, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      retryAfterSec: Math.ceil(config.windowMs / 1000),
    };
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'Retry-After': String(result.retryAfterSec),
  };
}
