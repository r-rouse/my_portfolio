import type { AnalyticsEvent } from '../../../lib/analytics/analyticsTypes';
import './Analytics.css';

interface EventFeedProps {
  events: AnalyticsEvent[];
}

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Page view',
  chat_opened: 'Chat opened',
  chat_message_sent: 'Message sent',
  chat_response_received: 'Response received',
  source_viewed: 'Section viewed',
  project_clicked: 'Project clicked',
  resume_downloaded: 'Resume downloaded',
  external_link_clicked: 'External link',
  session_started: 'Session started',
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatMetadata(event: AnalyticsEvent): string | null {
  const meta = event.metadata;
  if (!meta || Object.keys(meta).length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (meta.section) parts.push(String(meta.section));
  if (meta.projectTitle) parts.push(String(meta.projectTitle));
  if (meta.linkLabel) parts.push(String(meta.linkLabel));
  if (meta.messageLength != null) parts.push(`${meta.messageLength} chars`);
  if (meta.responseTimeMs != null) parts.push(`${meta.responseTimeMs}ms`);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function EventFeed({ events }: EventFeedProps) {
  if (events.length === 0) {
    return (
      <div className="event-feed event-feed-empty">
        <p>No activity yet. Visit the portfolio to generate events.</p>
      </div>
    );
  }

  return (
    <div className="event-feed">
      <ul className="event-feed-list">
        {events.map((event, index) => {
          const detail = formatMetadata(event);
          return (
            <li key={`${event.timestamp}-${index}`} className="event-feed-item">
              <span className="event-feed-time">{formatTime(event.timestamp)}</span>
              <span className="event-feed-name">
                {EVENT_LABELS[event.eventName] ?? event.eventName}
              </span>
              {detail && <span className="event-feed-detail">{detail}</span>}
              <span className="event-feed-path">{event.path}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
