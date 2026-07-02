/**
 * Analytics storage layer.
 *
 * Two interchangeable backends implement the shared AnalyticsStorage contract:
 *   - BlobsAnalyticsStore   → production (Netlify Blobs; durable, shared across
 *                             the ephemeral function instances Netlify spins up)
 *   - InMemoryAnalyticsStore → local dev (in-memory + a JSON file on disk)
 *
 * getAnalyticsStore() picks the right one at runtime, so the API routes and
 * client instrumentation never change.
 *
 * Future upgrades (Postgres, ClickHouse, Redis Streams, Segment/Amplitude, …)
 * only need a new class behind this same interface.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Store } from '@netlify/blobs';
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

const BLOB_STORE_NAME = 'analytics';
const BLOB_EVENTS_KEY = 'events';

/**
 * Netlify Blobs backend (production).
 *
 * Netlify Functions inject the Blobs context automatically, so no site ID or
 * token is required at runtime. Each instance is stateless: we read the current
 * event list from the blob, mutate, and write it back. That guarantees the
 * dashboard sees events recorded by any other function instance.
 *
 * Note: this is a read-modify-write with no locking. For a portfolio's traffic
 * that's fine; under heavy concurrent writes a rare event could be dropped.
 * Move to an append-friendly store (Redis Streams, Postgres) if that matters.
 */
class BlobsAnalyticsStore implements AnalyticsStorage {
  private store!: Store;

  /**
   * Loads @netlify/blobs lazily and probes the store. Importing dynamically
   * (rather than at module top level) ensures that if the package or the
   * Blobs runtime is unavailable, the failure is a catchable rejection here —
   * it can't crash the whole function on load and turn into a 502.
   */
  async init(): Promise<void> {
    const { getStore } = await import('@netlify/blobs');
    // Strong consistency so a GET reflects writes made moments earlier.
    this.store = getStore({ name: BLOB_STORE_NAME, consistency: 'strong' });
    await this.load();
  }

  private async load(): Promise<AnalyticsEvent[]> {
    const data = await this.store.get(BLOB_EVENTS_KEY, { type: 'json' });
    return Array.isArray(data) ? (data as AnalyticsEvent[]) : [];
  }

  async addEvent(event: AnalyticsEvent): Promise<void> {
    const events = await this.load();
    events.push(event);
    const trimmed =
      events.length > MAX_STORED_EVENTS
        ? events.slice(-MAX_STORED_EVENTS)
        : events;
    await this.store.setJSON(BLOB_EVENTS_KEY, trimmed);
  }

  async getEvents(options?: { limit?: number }): Promise<AnalyticsEvent[]> {
    const events = await this.load();
    const limit = options?.limit ?? events.length;
    return events.slice(-limit);
  }

  async getMetrics(): Promise<AnalyticsMetrics> {
    return computeMetrics(await this.load());
  }
}

/**
 * In-memory backend with optional JSON-file persistence (local dev).
 * The filesystem write is a no-op on read-only serverless hosts, which is why
 * production uses the Blobs backend instead.
 */
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
  }

  async getEvents(options?: { limit?: number }): Promise<AnalyticsEvent[]> {
    const limit = options?.limit ?? this.events.length;
    return this.events.slice(-limit);
  }

  async getMetrics(): Promise<AnalyticsMetrics> {
    return computeMetrics(this.events);
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

/** Aggregates a flat event list into the dashboard metrics shape. */
function computeMetrics(events: AnalyticsEvent[]): AnalyticsMetrics {
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

/** True when the Netlify Blobs runtime context is available (i.e. on Netlify). */
function blobsContextAvailable(): boolean {
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY ||
      process.env.NETLIFY_LOCAL
  );
}

// Cache the resolved store per process so warm function instances reuse it.
let storePromise: Promise<AnalyticsStorage> | null = null;

export async function getAnalyticsStore(): Promise<AnalyticsStorage> {
  if (!storePromise) {
    storePromise = resolveStore();
  }
  return storePromise;
}

async function resolveStore(): Promise<AnalyticsStorage> {
  if (blobsContextAvailable()) {
    try {
      const blobs = new BlobsAnalyticsStore();
      await blobs.init();
      return blobs;
    } catch (error) {
      console.error(
        '[analyticsStore] Netlify Blobs unavailable, falling back to in-memory:',
        error
      );
    }
  }

  const fallback = new InMemoryAnalyticsStore();
  await fallback.init();
  return fallback;
}
