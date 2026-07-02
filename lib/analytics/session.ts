/**
 * Anonymous session management for analytics.
 *
 * Uses sessionStorage so each browser tab gets a unique session ID that
 * resets when the tab closes. No cookies, no fingerprinting, no PII.
 */

const SESSION_KEY = 'portfolio_analytics_session_id';
const SESSION_STARTED_KEY = 'portfolio_analytics_session_started';

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Returns the current session ID, creating one if needed. */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/** True only on the first page load of a new browser tab session. */
export function isNewSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(SESSION_STARTED_KEY) !== 'true';
}

/** Mark the current tab session as initialized (after session_started fires). */
export function markSessionStarted(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(SESSION_STARTED_KEY, 'true');
}
