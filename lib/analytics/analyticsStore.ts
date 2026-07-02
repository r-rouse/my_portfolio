/**
 * Analytics storage layer — Phase 1: in-memory + optional JSON file persistence.
 *
 * TODO: Replace with a production-grade backend:
 *   - Supabase (real-time subscriptions + Postgres)
 *   - Postgres (durable event warehouse)
 *   - ClickHouse (high-volume analytics queries)
 *   - Redis Streams (real-time pub/sub + short-term buffer)
 *   - Segment / Amplitude (managed product analytics)
 *   - OpenTelemetry (unified observability pipeline)
 *
 * The AnalyticsStorage interface keeps this swap isolated from API routes
 * and client instrumentation.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ActivityBucket,
  AnalyticsEvent,
  AnalyticsMetrics,
  AnalyticsStorage,
} from './analyticsTypes';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const EVENTS_FILE = join(DATA_DIR, 'analytics-events.json');
const MAX_STORED_EVENTS = 10_000;
const RECENT_FEED_LIMIT = 50;
const ACTIVITY_BUCKET_DAYS = 14;

class InMemoryAnalyticsStore implements AnalyticsStorage {
  private events: AnalyticsEvent[] = [];
  private persistEnabled: boolean;

  constructor(persistEnabled = true) {
    this.persistEnabled = persistEnabled;
  }

  async init(): Promise<void> {
    if (!this.persistEnabled) {
      return;
    }

    try {
      const raw = await readFile(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AnalyticsEvent[];
      if (Array.isArray(parsed)) {
        this.events = parsed.slice(-MAX_STORED_EVENTS);
      }
    } catch {
      // File missing on first run — start with empty store.
    }
  }

  async addEvent(event: AnalyticsEvent): Promise<void> {
    this.events.push(event);

    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
    }

    if (this.persistEnabled) {
      await this.persist();
    }

    // TODO: Publish event to Redis pub/sub or WebSocket broadcast here
    // so connected dashboard clients receive updates without polling.
  }

  async getEvents(options?: { limit?: number }): Promise<AnalyticsEvent[]> {
    const limit = options?.limit ?? this.events.length;
    return this.events.slice(-limit);
  }

  async getMetrics(): Promise<AnalyticsMetrics> {
    const events = this.events;

    const sessionIds = new Set<string>();
    let totalPageViews = 0;
    let totalChatOpens = 0;
    let totalMessagesSent = 0;
    let responsesReceived = 0;
    const pageViewCounts = new Map<string, number>();
    const projectClickCounts = new Map<string, number>();
    const responseTimes: number[] = [];

    for (const event of events) {
      sessionIds.add(event.sessionId);

      switch (event.eventName) {
        case 'page_view':
          totalPageViews += 1;
          incrementCount(pageViewCounts, String(event.metadata?.section ?? event.path));
          break;
        case 'chat_opened':
          totalChatOpens += 1;
          break;
        case 'chat_message_sent':
          totalMessagesSent += 1;
          break;
        case 'chat_response_received':
          responsesReceived += 1;
          if (typeof event.metadata?.responseTimeMs === 'number') {
            responseTimes.push(event.metadata.responseTimeMs);
          }
          break;
        case 'project_clicked':
          incrementCount(
            projectClickCounts,
            String(event.metadata?.projectTitle ?? 'Unknown')
          );
          break;
        default:
          break;
      }
    }

    const avgResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
          )
        : null;

    return {
      totalSessions: sessionIds.size,
      totalPageViews,
      totalChatOpens,
      totalMessagesSent,
      mostViewedPage: topKey(pageViewCounts),
      mostClickedProject: topKey(projectClickCounts),
      chatUsageSummary: {
        opens: totalChatOpens,
        messagesSent: totalMessagesSent,
        responsesReceived,
        avgResponseTimeMs,
      },
      activityOverTime: buildActivityBuckets(events),
      recentEvents: events.slice(-RECENT_FEED_LIMIT).reverse(),
    };
  }

  private async persist(): Promise<void> {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(EVENTS_FILE, JSON.stringify(this.events, null, 2), 'utf-8');
    } catch (error) {
      console.error('[analyticsStore] Failed to persist events:', error);
    }
  }
}

function incrementCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topKey(map: Map<string, number>): string | null {
  let top: string | null = null;
  let max = 0;
  for (const [key, count] of map) {
    if (count > max) {
      max = count;
      top = key;
    }
  }
  return top;
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function buildActivityBuckets(events: AnalyticsEvent[]): ActivityBucket[] {
  const buckets: ActivityBucket[] = [];
  const today = startOfDay(new Date());

  for (let i = ACTIVITY_BUCKET_DAYS - 1; i >= 0; i--) {
    const bucketStart = new Date(today);
    bucketStart.setDate(bucketStart.getDate() - i);

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketEnd.getDate() + 1);

    const label = formatBucketLabel(bucketStart);
    const startMs = bucketStart.getTime();
    const endMs = bucketEnd.getTime();

    const count = events.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      return ts >= startMs && ts < endMs;
    }).length;

    buckets.push({ label, count });
  }

  return buckets;
}

function formatBucketLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Singleton store — shared across API requests within the same server process.
const store = new InMemoryAnalyticsStore();
let initPromise: Promise<void> | null = null;

export async function getAnalyticsStore(): Promise<AnalyticsStorage> {
  if (!initPromise) {
    initPromise = store.init();
  }
  await initPromise;
  return store;
}
