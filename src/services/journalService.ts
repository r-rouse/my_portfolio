import type { JournalFile } from '../../lib/journal/journalStore';

const CODE_KEY = 'journal_access_code';

export function getStoredJournalCode(): string {
  try {
    return sessionStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeJournalCode(code: string): void {
  sessionStorage.setItem(CODE_KEY, code);
}

export function clearJournalCode(): void {
  sessionStorage.removeItem(CODE_KEY);
}

function headers(code = ''): HeadersInit {
  const next: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (code) {
    next['x-journal-code'] = code;
  }
  return next;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.error === 'string') {
    return body.error;
  }
  return fallback;
}

export async function fetchJournalFiles(code = ''): Promise<JournalFile[]> {
  const response = await fetch('/api/journal', { headers: headers(code) });
  if (!response.ok) {
    throw new Error(await readError(response, 'Could not load the journal'));
  }
  const data = (await response.json()) as { files?: JournalFile[] };
  return Array.isArray(data.files) ? data.files : [];
}

/** Confirms a write access code without creating an entry (auth runs before body validation). */
export async function verifyJournalWriteAccess(code: string): Promise<void> {
  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: headers(code),
    body: JSON.stringify({}),
  });

  if (response.status === 401 || response.status === 503) {
    throw new Error(await readError(response, 'Unauthorized'));
  }

  // 400 = authorized but incomplete body — that means the code is valid.
  if (response.status !== 400 && !response.ok) {
    throw new Error(await readError(response, 'Could not verify access'));
  }
}

export async function createJournalFile(
  entry: { date: string; body: string },
  code = ''
): Promise<JournalFile> {
  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: headers(code),
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Could not save the entry'));
  }
  const data = (await response.json()) as { file: JournalFile };
  return data.file;
}

export async function deleteJournalFile(id: string, code = ''): Promise<void> {
  const response = await fetch(`/api/journal?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(code),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Could not delete the entry'));
  }
}
