/**
 * /api/journal — work journal.
 *
 * Each markdown file in src/components/journal/ is one journal entry.
 *
 * Read access: optional until JOURNAL_REQUIRE_ACCESS_CODE=true.
 * Write/delete: always require JOURNAL_ACCESS_CODE when configured (public
 * portfolio must not accept unauthenticated writes).
 */

import {
  isJournalCodeValid,
  journalAccessConfigured,
  journalAccessRequired,
} from '../../../lib/journal/auth';
import { getJournalStore } from '../../../lib/journal/journalStore';
import {
  BODY_LIMITS,
  FIELD_LIMITS,
  RATE_LIMITS,
  guardApiRequest,
} from '../../../lib/security';
import { clampString, jsonError, readJsonBody } from '../../../lib/security/request';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,178}\.md$/;

function unauthorized(): Response {
  return jsonError('Unauthorized', 401);
}

function requireConfiguredCode(request: Request): Response | null {
  if (!journalAccessConfigured()) {
    return jsonError('Journal access is not configured', 503);
  }

  const code = request.headers.get('x-journal-code') ?? '';
  if (!isJournalCodeValid(code)) {
    return unauthorized();
  }

  return null;
}

/** Public read when the feature flag is off; otherwise require the access code. */
function requireReadAccess(request: Request): Response | null {
  if (!journalAccessRequired()) {
    return null;
  }
  return requireConfiguredCode(request);
}

/** Mutations always require a valid access code. */
function requireWriteAccess(request: Request): Response | null {
  return requireConfiguredCode(request);
}

export async function GET(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.journalGet, async () => {
    const denied = requireReadAccess(request);
    if (denied) return denied;

    try {
      const store = await getJournalStore();
      const files = await store.list();
      return Response.json({ files });
    } catch (error) {
      console.error('[GET /api/journal]', error);
      return jsonError('Failed to load journal', 500);
    }
  });
}

export async function POST(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.journalPost, async () => {
    const denied = requireWriteAccess(request);
    if (denied) return denied;

    const parsed = await readJsonBody<{ date?: unknown; body?: unknown }>(
      request,
      BODY_LIMITS.journal
    );
    if (!parsed.ok) return parsed.response;

    const date = clampString(parsed.value.date, 32);
    const text = clampString(parsed.value.body, FIELD_LIMITS.journalBody);

    if (!date || !DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
      return jsonError('A valid date is required', 400);
    }

    if (!text) {
      return jsonError(
        `A journal note is required (max ${FIELD_LIMITS.journalBody} characters)`,
        400
      );
    }

    try {
      const store = await getJournalStore();
      const file = await store.add({ date, body: text });
      return Response.json({ file }, { status: 201 });
    } catch (error) {
      console.error('[POST /api/journal]', error);
      return jsonError('Failed to save entry', 500);
    }
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.journalDelete, async () => {
    const denied = requireWriteAccess(request);
    if (denied) return denied;

    try {
      const id = (new URL(request.url).searchParams.get('id') ?? '').trim();
      if (!id || id.length > FIELD_LIMITS.journalFilename || !SAFE_FILENAME.test(id)) {
        return jsonError('Entry id is required', 400);
      }

      const store = await getJournalStore();
      const removed = await store.remove(id);
      if (!removed) {
        return jsonError('Entry not found', 404);
      }

      return Response.json({ ok: true });
    } catch (error) {
      console.error('[DELETE /api/journal]', error);
      return jsonError('Failed to delete entry', 500);
    }
  });
}
