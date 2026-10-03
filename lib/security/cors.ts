/**
 * CORS allow-list for the Express API (Vite proxies locally; Netlify is same-origin).
 *
 * Set ALLOWED_ORIGINS as a comma-separated list in .env / Netlify env.
 */

const LOCAL_DEFAULTS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];

export function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const url = process.env.URL?.trim();
  const deployUrl = process.env.DEPLOY_PRIME_URL?.trim();

  return Array.from(
    new Set([
      ...LOCAL_DEFAULTS,
      ...fromEnv,
      ...(url ? [url] : []),
      ...(deployUrl ? [deployUrl] : []),
    ])
  );
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // same-origin / non-browser clients
  return getAllowedOrigins().includes(origin);
}
