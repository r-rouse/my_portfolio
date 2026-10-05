import { timingSafeEqual } from 'node:crypto';

/**
 * Shared access code for gated portfolio content (bio, resume).
 * Prefers CONTENT_ACCESS_CODE; falls back to JOURNAL_ACCESS_CODE.
 * Never expose either value to the client.
 *
 * Strips accidental wrapping quotes from Netlify/UI pastes: "107868" → 107868
 */
function normalizeSecret(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getConfiguredAccessCode(): string {
  return (
    normalizeSecret(process.env.CONTENT_ACCESS_CODE) ||
    normalizeSecret(process.env.JOURNAL_ACCESS_CODE) ||
    ''
  );
}

export function accessCodeConfigured(): boolean {
  return Boolean(getConfiguredAccessCode());
}

export function isAccessCodeValid(code: string): boolean {
  const expected = getConfiguredAccessCode();
  if (!expected || !code) {
    return false;
  }

  const provided = Buffer.from(code);
  const secret = Buffer.from(expected);
  if (provided.length !== secret.length) {
    return false;
  }

  return timingSafeEqual(provided, secret);
}
