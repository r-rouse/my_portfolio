/**
 * Analytics API — ingest events (POST) and serve dashboard metrics (GET).
 *
 * Hardened with rate limits, allow-listed event names, and field length caps
 * to reduce scraping / event-injection abuse.
 */

import { getAnalyticsStore } from '../../../lib/analytics/analyticsStore';
import type { AnalyticsEvent, AnalyticsEventName } from '../../../lib/analytics/analyticsTypes';
import {
  BODY_LIMITS,
  FIELD_LIMITS,
  RATE_LIMITS,
  guardApiRequest,
} from '../../../lib/security';
import {
  clampString,
  jsonError,
  readJsonBody,
  sanitizeText,
} from '../../../lib/security/request';

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

const PATH_PATTERN = /^[/\w\-.?=&%]*$/;

function sanitizeMetadata(
  metadata: unknown
): Record<string, string | number | boolean> | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    const safeKey = sanitizeText(key).slice(0, FIELD_LIMITS.analyticsMetadataKey);
    if (!safeKey) continue;

    if (typeof value === 'boolean' || typeof value === 'number') {
      if (Number.isFinite(value)) {
        result[safeKey] = value;
      }
      continue;
    }

    if (typeof value === 'string') {
      const safeValue = sanitizeText(value).slice(
        0,
        FIELD_LIMITS.analyticsMetadataValue
      );
      if (safeValue) {
        result[safeKey] = safeValue;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function parseAnalyticsEvent(body: unknown): AnalyticsEvent | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const event = body as Record<string, unknown>;
  const eventName = clampString(event.eventName, 64);
  const timestamp = clampString(event.timestamp, 64);
  const sessionId = clampString(event.sessionId, FIELD_LIMITS.analyticsSessionId);
  const path = clampString(event.path, FIELD_LIMITS.analyticsPath);

  if (
    !eventName ||
    !VALID_EVENTS.has(eventName as AnalyticsEventName) ||
    !timestamp ||
    !sessionId ||
    !path ||
    !PATH_PATTERN.test(path) ||
    Number.isNaN(Date.parse(timestamp))
  ) {
    return null;
  }

  return {
    eventName: eventName as AnalyticsEventName,
    timestamp,
    sessionId,
    path,
    metadata: sanitizeMetadata(event.metadata),
  };
}

export async function POST(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.analyticsPost, async () => {
    const parsed = await readJsonBody<unknown>(request, BODY_LIMITS.analytics);
    if (!parsed.ok) return parsed.response;

    const event = parseAnalyticsEvent(parsed.value);
    if (!event) {
      return jsonError('Invalid analytics event', 400);
    }

    try {
      const store = await getAnalyticsStore();
      await store.addEvent(event);
      return Response.json({ ok: true });
    } catch (error) {
      console.error('[POST /api/analytics]', error);
      return jsonError('Failed to record event', 500);
    }
  });
}

export async function GET(request: Request): Promise<Response> {
  return guardApiRequest(request, RATE_LIMITS.analyticsGet, async () => {
    try {
      const store = await getAnalyticsStore();
      const metrics = await store.getMetrics();
      return Response.json(metrics);
    } catch (error) {
      console.error('[GET /api/analytics]', error);
      return jsonError('Failed to fetch analytics', 500);
    }
  });
}
