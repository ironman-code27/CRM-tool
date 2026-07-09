import React from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import TeamCard from '../components/TeamCard';

interface TeamListProps {
  team: TeamMember[];
  leads: Lead[];
  activity: Activity[];
  handleRemoveMember: (id: string) => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  team,
  leads,
  activity,
  handleRemoveMember,
}) => {
  return (
    <div id="team-list">
      {team.map((member) => {
        const assignedCount = leads.filter((l) => l.assignee === member.name).length;
        const actsCount = activity.filter((a) => a.by === member.name).length;

        return (
          <TeamCard
            key={member.id}
            member={member}
            leadsAssignedCount={assignedCount}
            activitiesCount={actsCount}
            showRemoveButton={true}
            onRemove={() => handleRemoveMember(member.id)}
          />
        );
      })}
    </div>
  );
};
export default TeamList;
