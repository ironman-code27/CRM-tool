import React from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import ActivityItem from '../components/ActivityItem';
import { useCRM } from '../context/CRMContext';

interface RecentActivityProps {
  recentActivities: Activity[];
  leads: Lead[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivities, leads }) => {
  const { setCurrentView } = useCRM();

  return (
    <div className="db-section-card db-animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="db-section-header">
        <div className="db-section-title-wrap">
          <span className="db-section-icon">📈</span>
          <span className="db-section-title">Recent Activity</span>
        </div>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={() => setCurrentView('activity')}
          style={{ borderRadius: '8px', fontSize: '12px' }}
        >
          View all
        </button>
      </div>
      <div className="db-section-body" id="dash-activity" style={{ padding: '20px 24px' }}>
        {recentActivities.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.map((act) => {
              const lead = leads.find((x) => x.id === act.leadId);
              return (
                <ActivityItem
                  key={act.id}
                  activity={act}
                  lead={lead}
                  variant="dashboard"
                />
              );
            })}
          </div>
        ) : (
          <div className="db-empty-state">
            <div className="db-empty-icon">📋</div>
            <div className="db-empty-text">No activities yet</div>
            <div className="db-empty-subtext">Activities will appear here when you engage with leads.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
