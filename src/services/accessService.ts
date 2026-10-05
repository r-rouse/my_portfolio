const STORAGE_KEY = 'content_access_unlocked';

export function isContentUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setContentUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

export async function verifyAccessCode(code: string): Promise<void> {
  const response = await fetch('/api/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body.error === 'string' ? body.error : 'Unauthorized';
    throw new Error(message);
  }
}
