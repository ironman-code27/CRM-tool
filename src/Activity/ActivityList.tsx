import React from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import ActivityItem from '../components/ActivityItem';

interface ActivityListProps {
  sortedActivities: Activity[];
  leads: Lead[];
  team: TeamMember[];
  handleLeadClick: (leadId: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  sortedActivities,
  leads,
  team,
  handleLeadClick,
}) => {
  return (
    <div id="activity-list">
      {sortedActivities.length ? (
        sortedActivities.map((act) => {
          const lead = leads.find((l) => l.id === act.leadId);
          const member = team.find((m) => m.name === act.by);
          return (
            <ActivityItem
              key={act.id}
              activity={act}
              lead={lead}
              teamMember={member}
              showLeadLink={true}
              onLeadClick={handleLeadClick}
              variant="log"
            />
          );
        })
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📬</div>
          No activities logged yet.
          <br />
          <span style={{ fontSize: '12px' }}>
            Use "+ Log activity" to track LinkedIn, emails, calls and events.
          </span>
        </div>
      )}
    </div>
  );
};
export default ActivityList;
