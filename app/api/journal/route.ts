/**
 * /api/journal — work journal.
 *
 * Each markdown file in src/components/journal/ is one journal entry.
 * Access code is optional until JOURNAL_REQUIRE_ACCESS_CODE=true.
 */

import {
  isJournalCodeValid,
  journalAccessConfigured,
  journalAccessRequired,
} from '../../../lib/journal/auth';
import { getJournalStore } from '../../../lib/journal/journalStore';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function requireAccess(request: Request): Response | null {
  if (!journalAccessRequired()) {
    return null;
  }

  if (!journalAccessConfigured()) {
    return Response.json(
      { error: 'Journal access is not configured' },
      { status: 503 }
    );
  }

  const code = request.headers.get('x-journal-code') ?? '';
  if (!isJournalCodeValid(code)) {
    return unauthorized();
  }

  return null;
}

export async function GET(request: Request): Promise<Response> {
  const denied = requireAccess(request);
  if (denied) return denied;

  try {
    const store = await getJournalStore();
    const files = await store.list();
    return Response.json({ files });
  } catch (error) {
    console.error('[GET /api/journal]', error);
    return Response.json({ error: 'Failed to load journal' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const denied = requireAccess(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as { date?: string; body?: string };
    const date = body.date?.trim() ?? '';
    const text = body.body?.trim() ?? '';

    if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
      return Response.json({ error: 'A valid date is required' }, { status: 400 });
    }

    if (!text) {
      return Response.json({ error: 'A journal note is required' }, { status: 400 });
    }

    const store = await getJournalStore();
    const file = await store.add({ date, body: text });
    return Response.json({ file }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/journal]', error);
    return Response.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const denied = requireAccess(request);
  if (denied) return denied;

  try {
    const id = new URL(request.url).searchParams.get('id')?.trim() ?? '';
    if (!id) {
      return Response.json({ error: 'Entry id is required' }, { status: 400 });
    }

    const store = await getJournalStore();
    const removed = await store.remove(id);
    if (!removed) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/journal]', error);
    return Response.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
