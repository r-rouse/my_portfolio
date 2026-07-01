/**
 * Real-time analytics dashboard — polls /api/analytics every 4 seconds.
 *
 * TODO: Replace useEffect polling with:
 *   - WebSocket connection for bidirectional live updates
 *   - Server-Sent Events (EventSource) for lightweight server push
 *   - Redis pub/sub fan-out to multiple dashboard clients
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AnalyticsMetrics } from '../../../lib/analytics/analyticsTypes';
import {
  fetchAnalyticsMetrics,
  POLL_INTERVAL_MS,
} from '../../services/analyticsService';
import MetricCard from './MetricCard';
import EventFeed from './EventFeed';
import ActivityChart from './ActivityChart';
import './Analytics.css';

const EMPTY_METRICS: AnalyticsMetrics = {
  totalSessions: 0,
  totalPageViews: 0,
  totalChatOpens: 0,
  totalMessagesSent: 0,
  mostViewedPage: null,
  mostClickedProject: null,
  chatUsageSummary: {
    opens: 0,
    messagesSent: 0,
    responsesReceived: 0,
    avgResponseTimeMs: null,
  },
  activityOverTime: [],
  recentEvents: [],
};

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAnalyticsMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Unable to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const { chatUsageSummary } = metrics;

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1 className="analytics-title">Portfolio Analytics</h1>
          <p className="analytics-subtitle">
            Real-time visitor activity and chatbot usage
          </p>
        </div>
        <div className="analytics-header-actions">
          {lastUpdated && (
            <span className="analytics-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Link to="/" className="analytics-back-link">
            ← Back to portfolio
          </Link>
        </div>
      </header>

      {error && <div className="analytics-error">{error}</div>}

      {isLoading ? (
        <p className="analytics-loading">Loading analytics…</p>
      ) : (
        <>
          <section className="analytics-metrics-grid">
            <MetricCard label="Total Sessions" value={metrics.totalSessions} />
            <MetricCard label="Page Views" value={metrics.totalPageViews} />
            <MetricCard label="Chat Opens" value={metrics.totalChatOpens} />
            <MetricCard label="Messages Sent" value={metrics.totalMessagesSent} />
            <MetricCard
              label="Most Viewed Page"
              value={metrics.mostViewedPage ?? '—'}
            />
            <MetricCard
              label="Most Clicked Project"
              value={metrics.mostClickedProject ?? '—'}
            />
          </section>

          <div className="analytics-panels">
            <section className="analytics-panel">
              <h2 className="analytics-panel-title">Activity Over Time</h2>
              <p className="analytics-panel-desc">Events per 15-minute window</p>
              <ActivityChart buckets={metrics.activityOverTime} />
            </section>

            <section className="analytics-panel">
              <h2 className="analytics-panel-title">Chat Usage</h2>
              <div className="chat-usage-grid">
                <div className="chat-usage-stat">
                  <span className="chat-usage-value">{chatUsageSummary.opens}</span>
                  <span className="chat-usage-label">Opens</span>
                </div>
                <div className="chat-usage-stat">
                  <span className="chat-usage-value">
                    {chatUsageSummary.messagesSent}
                  </span>
                  <span className="chat-usage-label">Messages</span>
                </div>
                <div className="chat-usage-stat">
                  <span className="chat-usage-value">
                    {chatUsageSummary.responsesReceived}
                  </span>
                  <span className="chat-usage-label">Responses</span>
                </div>
                <div className="chat-usage-stat">
                  <span className="chat-usage-value">
                    {chatUsageSummary.avgResponseTimeMs != null
                      ? `${chatUsageSummary.avgResponseTimeMs}ms`
                      : '—'}
                  </span>
                  <span className="chat-usage-label">Avg response</span>
                </div>
              </div>
            </section>
          </div>

          <section className="analytics-panel analytics-panel-full">
            <h2 className="analytics-panel-title">Recent Activity</h2>
            <EventFeed events={metrics.recentEvents} />
          </section>
        </>
      )}

      <footer className="analytics-footer">
        <p>
          Privacy-conscious telemetry — no PII, IPs, or message content collected.
          Polling every {POLL_INTERVAL_MS / 1000}s.
        </p>
      </footer>
    </div>
  );
}
