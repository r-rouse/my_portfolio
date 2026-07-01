/**
 * Client-side event tracking — the single entry point for instrumentation.
 *
 * Usage:
 *   trackEvent('chat_message_sent', { messageLength: 42 });
 *
 * Events are fire-and-forget POSTs to /api/analytics. Failures are swallowed
 * so analytics never break the user experience.
 */

import type { AnalyticsEventInput } from './analyticsTypes';
import { getSessionId } from './session';

export async function trackEvent(
  eventName: AnalyticsEventInput['eventName'],
  metadata?: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    eventName,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    path: window.location.pathname,
    metadata,
  };

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should never surface errors to the user.
  }
}
