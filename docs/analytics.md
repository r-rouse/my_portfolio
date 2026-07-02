# Portfolio Analytics

Privacy-conscious event instrumentation and a real-time analytics dashboard. Tracks visitor activity and chatbot usage without collecting personal data.

## Overview

```
┌──────────────┐   trackEvent()    ┌──────────────────┐
│  Portfolio   │ ────────────────► │ POST /api/analytics │
│  UI          │                   └────────┬─────────┘
└──────────────┘                            │
                                              ▼
                                     ┌─────────────────┐
                                     │ AnalyticsStore  │
                                     │ (in-memory +    │
                                     │  JSON file)     │
                                     └────────┬────────┘
                                              │
┌──────────────┐   poll every 4s    ┌─────────▼─────────┐
│  Dashboard   │ ◄───────────────── │ GET /api/analytics │
│  /analytics  │                    └───────────────────┘
└──────────────┘
```

## Dashboard

Open the dashboard via the **Analytics** tab in the navigation bar, or navigate directly to:

```
http://localhost:5173/analytics
```

### Metrics displayed

| Metric | Description |
|--------|-------------|
| Total Sessions | Unique anonymous session IDs |
| Page Views | Count of `page_view` events |
| Chat Opens | Count of `chat_opened` events |
| Messages Sent | Count of `chat_message_sent` events |
| Most Viewed Page | Section with the most `page_view` / `source_viewed` activity |
| Most Clicked Project | Project title with the most `project_clicked` events |
| Activity Over Time | Bar chart — events per day (last 14 days) |
| Chat Usage Summary | Opens, messages, responses, average response time |
| Recent Activity | Live feed of the 50 most recent events |

The dashboard polls `GET /api/analytics` every **4 seconds**. A timestamp in the header shows the last refresh time.

## Tracked events

| Event | Trigger | Metadata |
|-------|---------|----------|
| `session_started` | First page load in a browser tab | `sessionId` |
| `page_view` | Portfolio homepage loads | `section` |
| `source_viewed` | User scrolls to a section (40% visible) or clicks nav | `section`, optionally `via: "navigation"` |
| `chat_opened` | Chat widget opened | — |
| `chat_message_sent` | User sends a chat message | `messageLength` |
| `chat_response_received` | AI response received | `messageLength`, `responseTimeMs`, `responseLength` |
| `project_clicked` | User clicks a project link | `projectId`, `projectTitle` |
| `resume_downloaded` | User clicks "Download Resume" | — |
| `external_link_clicked` | User clicks GitHub, LinkedIn, email, etc. | `linkLabel` |

### Event shape

Every event sent to the API follows this structure:

```ts
{
  eventName: string;
  timestamp: string;      // ISO 8601
  sessionId: string;      // anonymous, per browser tab
  path: string;           // e.g. "/" or "/analytics"
  metadata?: Record<string, unknown>;
}
```

## Privacy model

Analytics are designed to be privacy-conscious:

| Collected | Not collected |
|-----------|---------------|
| Anonymous session ID (per tab) | Names, emails, phone numbers |
| Event name and timestamp | IP addresses |
| Current page path | Full chat message content |
| Non-PII metadata (section names, project titles, message length, response time) | URLs that may contain PII |

Session IDs are generated client-side and stored in `sessionStorage`. They reset when the browser tab closes. No cookies or fingerprinting.

## Architecture

### Client instrumentation

**`lib/analytics/trackEvent.ts`** — single entry point for all tracking:

```ts
import { trackEvent } from '../../lib/analytics/trackEvent';

trackEvent('chat_message_sent', { messageLength: message.length });
```

Events are fire-and-forget `POST` requests. Failures are silently swallowed so analytics never break the user experience.

**`lib/analytics/session.ts`** — manages anonymous session IDs via `sessionStorage`.

**`src/hooks/usePortfolioAnalytics.ts`** — portfolio-wide hooks:

- `usePortfolioAnalytics()` — fires `session_started`, `page_view`, and observes sections for `source_viewed`
- `trackSectionNavigation(sectionId)` — nav bar section clicks
- `trackExternalLink(label)` — external link clicks
- `trackResumeDownload()` — resume download button
- `trackProjectClick(id, title)` — project card clicks

### Where events are instrumented

| File | Events |
|------|--------|
| `src/hooks/usePortfolioAnalytics.ts` | `session_started`, `page_view`, `source_viewed` |
| `src/components/ChatWidget.tsx` | `chat_opened` |
| `src/components/ChatWindow.tsx` | `chat_message_sent`, `chat_response_received` |
| `src/components/ProjectCard.jsx` | `project_clicked` |
| `src/components/Navigation.jsx` | `source_viewed`, `external_link_clicked` |
| `src/components/Footer.jsx` | `external_link_clicked` |
| `src/App.jsx` | `resume_downloaded`, `external_link_clicked` |

### Server storage

**`lib/analytics/analyticsStore.ts`** — Phase 1 storage:

- In-memory event buffer (up to 10,000 events)
- Persists to `data/analytics-events.json` on each write
- Computes aggregated metrics on read

The store implements the `AnalyticsStorage` interface defined in `lib/analytics/analyticsTypes.ts`. Swap the implementation without changing the API or client code.

### API

**`app/api/analytics/route.ts`**

| Method | Purpose |
|--------|---------|
| `POST` | Ingest a single event |
| `GET` | Return aggregated metrics for the dashboard |

**POST example:**

```bash
curl -X POST http://localhost:3001/api/analytics \
  -H 'Content-Type: application/json' \
  -d '{
    "eventName": "page_view",
    "timestamp": "2026-07-01T12:00:00.000Z",
    "sessionId": "sess_abc123",
    "path": "/",
    "metadata": { "section": "home" }
  }'
```

**GET response shape:**

```ts
{
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
  activityOverTime: { label: string; count: number }[];
  recentEvents: AnalyticsEvent[];
}
```

## File structure

```
lib/analytics/
  analyticsTypes.ts    # Event types, metrics shape, storage interface
  session.ts           # Anonymous session ID management
  trackEvent.ts        # Client-side tracking helper
  analyticsStore.ts    # Server-side storage and metric aggregation

app/api/analytics/
  route.ts             # POST + GET handlers

app/analytics/
  page.tsx             # /analytics route (renders dashboard)

src/components/analytics/
  AnalyticsDashboard.tsx # Main dashboard layout + polling
  MetricCard.tsx       # Single metric display card
  EventFeed.tsx        # Recent activity list
  ActivityChart.tsx    # Bar chart for activity over time
  Analytics.css        # Dashboard styles

src/services/
  analyticsService.ts  # Client fetch wrapper for GET /api/analytics

src/hooks/
  usePortfolioAnalytics.ts  # Portfolio instrumentation hooks
```

## Adding new events

1. Add the event name to `AnalyticsEventName` in `lib/analytics/analyticsTypes.ts`
2. Add it to the `VALID_EVENTS` set in `app/api/analytics/route.ts`
3. Add a label in `EventFeed.tsx` (`EVENT_LABELS`)
4. Call `trackEvent('your_event', { ...metadata })` from the relevant component
5. Optionally update `getMetrics()` in `analyticsStore.ts` to aggregate the new event

## Future storage backends

The `AnalyticsStorage` interface is designed for easy migration. TODO comments in `analyticsStore.ts` mark integration points for:

| Backend | Use case |
|---------|----------|
| **Supabase** | Real-time subscriptions + Postgres |
| **Postgres** | Durable event warehouse |
| **ClickHouse** | High-volume analytics queries |
| **Redis Streams** | Real-time pub/sub + short-term buffer |
| **Segment** | Managed event routing |
| **Amplitude** | Product analytics platform |
| **OpenTelemetry** | Unified observability pipeline |

To migrate, implement `AnalyticsStorage` with your chosen backend and update `getAnalyticsStore()` to return the new instance.

## Real-time updates (future)

The dashboard currently polls every 4 seconds. TODO comments mark where to add:

| Approach | Trade-off |
|----------|-----------|
| **WebSockets** | Bidirectional, best for live dashboards |
| **Server-Sent Events** | Simpler one-way server → client stream |
| **Redis pub/sub** | Fan-out events to multiple dashboard instances |

On the storage side, `analyticsStore.addEvent()` has a TODO to publish events after write so connected clients receive updates instantly.

## Data persistence

Events are written to `data/analytics-events.json`. This file is gitignored — it contains runtime analytics data only.

To reset analytics data, delete the file and restart the API server:

```bash
rm data/analytics-events.json
```

## Running locally

Both the frontend and API server must be running for analytics to work end-to-end:

```bash
npm run dev
```

1. Visit `http://localhost:5173/` and interact with the portfolio
2. Open `http://localhost:5173/analytics` to see events appear in near real time

If the dashboard shows "Unable to load analytics data", confirm the API server is running on port 3001.
