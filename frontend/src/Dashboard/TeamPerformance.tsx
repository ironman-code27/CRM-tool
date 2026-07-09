import React from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import TeamCard from '../components/TeamCard';

interface TeamPerformanceProps {
  team: TeamMember[];
  leads: Lead[];
  activity: Activity[];
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ team, leads, activity }) => {
  return (
    <div style={{ marginTop: '16px' }} className="card">
      <div className="card-header">
        <span className="card-header-title">Team performance</span>
      </div>
      <div className="card-body" id="dash-team">
        {team.map((m) => {
          const assigned = leads.filter((l) => l.assignee === m.name).length;
          const acts = activity.filter((a) => a.by === m.name).length;
          const closed = leads.filter((l) => l.assignee === m.name && l.stage === 'closed').length;
          return (
            <TeamCard
              key={m.id}
              member={m}
              leadsAssignedCount={assigned}
              activitiesCount={acts}
              closedLeadsCount={closed}
            />
          );
        })}
      </div>
    </div>
  );
};
export default TeamPerformance;
