/**
 * Dashboard data fetching — polls the analytics API for near-real-time updates.
 *
 * TODO: Replace polling with WebSockets, SSE, or Redis pub/sub for
 * instant event delivery without repeated HTTP requests.
 */

import type { AnalyticsMetrics } from '../../lib/analytics/analyticsTypes';

const POLL_INTERVAL_MS = 4000;

export async function fetchAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const response = await fetch('/api/analytics');

  if (!response.ok) {
    throw new Error('Failed to load analytics');
  }

  return response.json() as Promise<AnalyticsMetrics>;
}

export { POLL_INTERVAL_MS };
