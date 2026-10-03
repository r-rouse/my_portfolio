/**
 * Request helpers shared by API routes (Express + Netlify Functions).
 */

const DEFAULT_MAX_BODY_BYTES = 32_768; // 32 KB

export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const nf = request.headers.get('x-nf-client-connection-ip')?.trim();
  if (nf) return nf;

  return 'unknown';
}

export function jsonError(
  error: string,
  status: number,
  extraHeaders?: HeadersInit
): Response {
  return Response.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...extraHeaders,
      },
    }
  );
}

/**
 * Parse JSON with a hard byte limit to reduce oversized-payload abuse.
 */
export async function readJsonBody<T>(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES
): Promise<{ ok: true; value: T } | { ok: false; response: Response }> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = Number(contentLength);
    if (Number.isFinite(size) && size > maxBytes) {
      return {
        ok: false,
        response: jsonError('Request body too large', 413),
      };
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: jsonError('Request body too large', 413),
    };
  }

  if (!raw.trim()) {
    return {
      ok: false,
      response: jsonError('Request body is required', 400),
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: jsonError('Invalid JSON body', 400),
    };
  }
}

/** Strip control characters that are commonly used in injection payloads. */
export function sanitizeText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function clampString(
  input: unknown,
  maxLength: number
): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = sanitizeText(input);
  if (!cleaned) return null;
  if (cleaned.length > maxLength) return null;
  return cleaned;
}
