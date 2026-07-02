/**
 * Analytics type definitions — shared between client instrumentation and server storage.
 *
 * Architecture:
 *   Browser (trackEvent) → POST /api/analytics → AnalyticsStore → Dashboard (GET /api/analytics)
 *
 * Privacy: events carry only anonymous session IDs and non-PII metadata.
 * Never include names, emails, IPs, or full chat message content.
 */

/** Canonical event names instrumented across the portfolio. */
export type AnalyticsEventName =
  | 'page_view'
  | 'chat_opened'
  | 'chat_message_sent'
  | 'chat_response_received'
  | 'source_viewed'
  | 'project_clicked'
  | 'resume_downloaded'
  | 'external_link_clicked'
  | 'session_started';

export interface AnalyticsEvent {
  eventName: AnalyticsEventName;
  timestamp: string;
  sessionId: string;
  path: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName;
  metadata?: Record<string, unknown>;
}

/** Aggregated metrics computed server-side for the dashboard. */
export interface AnalyticsMetrics {
  totalSessions: number;
  totalPageViews: number;
  totalChatOpens: number;
  totalMessagesSent: number;
  mostViewedPage: string | null;
  mostClickedProject: string | null;
  chatUsageSummary: {
    opens: number;
    messagesSent: number;
    responsesReceived: number;
    avgResponseTimeMs: number | null;
  };
  activityOverTime: ActivityBucket[];
  recentEvents: AnalyticsEvent[];
}

export interface ActivityBucket {
  label: string;
  count: number;
}

/** Storage contract — swap implementations without changing API or instrumentation. */
export interface AnalyticsStorage {
  addEvent(event: AnalyticsEvent): Promise<void>;
  getEvents(options?: { limit?: number }): Promise<AnalyticsEvent[]>;
  getMetrics(): Promise<AnalyticsMetrics>;
}
