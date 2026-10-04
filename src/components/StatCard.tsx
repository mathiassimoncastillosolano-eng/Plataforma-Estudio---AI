import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-label">{label}</div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
