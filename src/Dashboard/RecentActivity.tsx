import React from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import ActivityItem from '../components/ActivityItem';

interface RecentActivityProps {
  recentActivities: Activity[];
  leads: Lead[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivities, leads }) => {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">Recent activity</span>
      </div>
      <div className="card-body" id="dash-activity" style={{ padding: '12px 16px' }}>
        {recentActivities.length ? (
          recentActivities.map((act) => {
            const lead = leads.find((x) => x.id === act.leadId);
            return (
              <ActivityItem
                key={act.id}
                activity={act}
                lead={lead}
                variant="dashboard"
              />
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            No activities yet
          </div>
        )}
      </div>
    </div>
  );
};
export default RecentActivity;
