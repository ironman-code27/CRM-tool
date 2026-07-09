import React from 'react';

interface StatsCardProps {
  label: string;
  val: number | string;
  variant?: 's-teal' | 's-blue' | 's-amber' | 's-green' | 's-purple' | 's-red';
}

const StatsCard: React.FC<StatsCardProps> = ({ label, val, variant }) => {
  return (
    <div className={`stat-card ${variant || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{val}</div>
    </div>
  );
};

interface DashboardStatsProps {
  leadsCount: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  closedCount: number;
  activitiesCount: number;
  openTasksCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  leadsCount,
  newCount,
  contactedCount,
  qualifiedCount,
  closedCount,
  activitiesCount,
  openTasksCount,
}) => {
  return (
    <div className="stat-grid" id="stats">
      <StatsCard label="Total leads" val={leadsCount} variant="s-teal" />
      <StatsCard label="New" val={newCount} />
      <StatsCard label="Contacted" val={contactedCount} variant="s-blue" />
      <StatsCard label="Qualified" val={qualifiedCount} variant="s-amber" />
      <StatsCard label="Closed" val={closedCount} variant="s-green" />
      <StatsCard label="Activities" val={activitiesCount} variant="s-purple" />
      <StatsCard label="Open tasks" val={openTasksCount} variant="s-red" />
    </div>
  );
};
export default DashboardStats;
