import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import ActivityList from './ActivityList';

export const ActivityPage: React.FC = () => {
  const {
    activity,
    leads,
    team,
    setCurrentView,
    setCurrentDetailId,
    setActiveModal,
    setPreselectedLeadId,
  } = useCRM();

  // Sort activities by date descending
  const sortedActivities = useMemo(() => {
    return [...activity].sort((a, b) => b.date.localeCompare(a.date));
  }, [activity]);

  const handleLeadClick = (leadId: string) => {
    setCurrentDetailId(leadId);
    setCurrentView('detail');
  };

  const handleLogActivity = () => {
    setPreselectedLeadId(null);
    setActiveModal('activity');
  };

  return (
    <div id="view-activity" className="view active">
      {/* Activity Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>Activity log</div>
        <button className="btn btn-primary btn-sm" onClick={handleLogActivity}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log activity
        </button>
      </div>

      {/* Channels Legend */}
      <div className="channel-legend">
        <div className="ch-legend-item">
          <div className="channel-dot ch-li">LI</div> LinkedIn
        </div>
        <div className="ch-legend-item">
          <div className="channel-dot ch-em">EM</div> Email
        </div>
        <div className="ch-legend-item">
          <div className="channel-dot ch-ph">PH</div> Phone call
        </div>
        <div className="ch-legend-item">
          <div className="channel-dot ch-ev">EV</div> In-person / Event
        </div>
      </div>

      {/* Activities List */}
      <ActivityList
        sortedActivities={sortedActivities}
        leads={leads}
        team={team}
        handleLeadClick={handleLeadClick}
      />
    </div>
  );
};
export default ActivityPage;
