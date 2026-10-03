import { timingSafeEqual } from 'node:crypto';

/**
 * Feature flag: set JOURNAL_REQUIRE_ACCESS_CODE=true to enforce the access code.
 * When unset/false, the journal API is open (code path stays in place for later).
 */
export function journalAccessRequired(): boolean {
  return process.env.JOURNAL_REQUIRE_ACCESS_CODE === 'true';
}

/** Access code is server-only (JOURNAL_ACCESS_CODE). Never return it to the client. */
export function isJournalCodeValid(code: string): boolean {
  const expected = process.env.JOURNAL_ACCESS_CODE ?? '';
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

export function journalAccessConfigured(): boolean {
  return Boolean(process.env.JOURNAL_ACCESS_CODE);
}
