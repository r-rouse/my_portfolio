/**
 * Analytics API — ingest events (POST) and serve dashboard metrics (GET).
 *
 * Architecture position:
 *   trackEvent (client) → POST /api/analytics → AnalyticsStore
 *   AnalyticsDashboard → GET /api/analytics (polled every 3–5s) → AnalyticsStore
 *
 * TODO: Replace polling with real-time push:
 *   - WebSockets (bidirectional, good for live dashboards)
 *   - Server-Sent Events (simpler one-way server → client stream)
 *   - Redis pub/sub (fan-out events to multiple dashboard instances)
 */

import { getAnalyticsStore } from '../../../lib/analytics/analyticsStore';
import type { AnalyticsEvent, AnalyticsEventName } from '../../../lib/analytics/analyticsTypes';

const VALID_EVENTS = new Set<AnalyticsEventName>([
  'page_view',
  'chat_opened',
  'chat_message_sent',
  'chat_response_received',
  'source_viewed',
  'project_clicked',
  'resume_downloaded',
  'external_link_clicked',
  'session_started',
]);

function isValidEvent(body: unknown): body is AnalyticsEvent {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const event = body as Record<string, unknown>;
  return (
    typeof event.eventName === 'string' &&
    VALID_EVENTS.has(event.eventName as AnalyticsEventName) &&
    typeof event.timestamp === 'string' &&
    typeof event.sessionId === 'string' &&
    typeof event.path === 'string'
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    if (!isValidEvent(body)) {
      return Response.json({ error: 'Invalid analytics event' }, { status: 400 });
    }

    const store = await getAnalyticsStore();
    await store.addEvent(body);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/analytics]', error);
    return Response.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  try {
    const store = await getAnalyticsStore();
    const metrics = await store.getMetrics();

    return Response.json(metrics);
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
