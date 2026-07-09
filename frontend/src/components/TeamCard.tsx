import React from 'react';
import type { TeamMember } from '../types/TeamMember';
import { nameInitials } from '../utils/helpers';

interface TeamCardProps {
  member: TeamMember;
  leadsAssignedCount: number;
  activitiesCount: number;
  closedLeadsCount?: number;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  member,
  leadsAssignedCount,
  activitiesCount,
  closedLeadsCount,
  showRemoveButton = false,
  onRemove,
}) => {
  const isDashboardView = closedLeadsCount !== undefined;

  if (isDashboardView) {
    const closeRate = leadsAssignedCount
      ? Math.round((closedLeadsCount! / leadsAssignedCount) * 100)
      : 0;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="team-avatar-lg"
          style={{ background: `${member.color}22`, color: member.color }}
        >
          {nameInitials(member.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{member.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
            {leadsAssignedCount} leads assigned · {activitiesCount} activities · {closedLeadsCount} closed
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text2)' }}>
          {closeRate}% close rate
        </div>
      </div>
    );
  }

  return (
    <div className="team-card">
      <div
        className="team-avatar-lg"
        style={{ background: `${member.color}22`, color: member.color }}
      >
        {nameInitials(member.name)}
      </div>
      <div className="team-info">
        <div className="team-name">{member.name}</div>
        <div className="team-stats">
          {leadsAssignedCount} leads assigned · {activitiesCount} activities logged
        </div>
      </div>
      {showRemoveButton ? (
        <button className="btn btn-danger btn-sm" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
};
export default TeamCard;
