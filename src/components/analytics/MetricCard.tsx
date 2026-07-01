import type { ReactNode } from 'react';
import './Analytics.css';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="metric-card-label">{label}</p>
      <p className="metric-card-value">{value}</p>
      {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}
    </div>
  );
}
