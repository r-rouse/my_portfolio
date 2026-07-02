import type { ActivityBucket } from '../../../lib/analytics/analyticsTypes';
import './Analytics.css';

interface ActivityChartProps {
  buckets: ActivityBucket[];
}

export default function ActivityChart({ buckets }: ActivityChartProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="activity-chart">
      <div className="activity-chart-bars">
        {buckets.map((bucket) => {
          const heightPct = (bucket.count / maxCount) * 100;
          return (
            <div key={bucket.label} className="activity-chart-bar-group">
              <div className="activity-chart-bar-track">
                <div
                  className="activity-chart-bar"
                  style={{ height: `${heightPct}%` }}
                  title={`${bucket.count} events`}
                />
              </div>
              <span className="activity-chart-count">{bucket.count}</span>
              <span className="activity-chart-label">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
