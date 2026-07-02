/**
 * /analytics route page — standalone dashboard separate from the main portfolio.
 *
 * Mounted via React Router in src/main.jsx. Kept under app/analytics/ to mirror
 * the App Router convention used by API routes in this project.
 */

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
