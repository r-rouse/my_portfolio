import { timingSafeEqual } from 'node:crypto';

/**
 * Shared access code for gated portfolio content (bio, resume).
 * Prefers CONTENT_ACCESS_CODE; falls back to JOURNAL_ACCESS_CODE.
 * Never expose either value to the client.
 */
export function getConfiguredAccessCode(): string {
  return (
    process.env.CONTENT_ACCESS_CODE?.trim() ||
    process.env.JOURNAL_ACCESS_CODE?.trim() ||
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
