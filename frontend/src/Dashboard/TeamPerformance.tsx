import React, { useState, useEffect } from 'react';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import { nameInitials } from '../utils/helpers';

interface TeamPerformanceProps {
  team: TeamMember[];
  leads: Lead[];
  activity: Activity[];
}

const TeamRow: React.FC<{
  member: TeamMember;
  assigned: number;
  acts: number;
  closed: number;
}> = ({ member, assigned, acts, closed }) => {
  const closeRate = assigned ? Math.round((closed / assigned) * 100) : 0;
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Staggered/delayed animation trigger for the progress bar width transition
    const timer = setTimeout(() => {
      setProgressWidth(closeRate);
    }, 150);
    return () => clearTimeout(timer);
  }, [closeRate]);

  return (
    <div className="db-team-row">
      <div 
        className="db-team-avatar"
        style={{ backgroundColor: `${member.color}15`, color: member.color }}
      >
        {nameInitials(member.name)}
      </div>
      <div>
        <div className="db-team-info-name">{member.name}</div>
      </div>
      <div className="db-team-metrics db-team-row-stats">
        <div className="db-team-metric-item">
          <span className="db-team-metric-label">Assigned Leads</span>
          <span className="db-team-metric-val">{assigned}</span>
        </div>
        <div className="db-team-metric-item">
          <span className="db-team-metric-label">Activities</span>
          <span className="db-team-metric-val">{acts}</span>
        </div>
        <div className="db-team-metric-item">
          <span className="db-team-metric-label">Closed Deals</span>
          <span className="db-team-metric-val">{closed}</span>
        </div>
      </div>
      <div className="db-team-progress-wrapper db-team-row-progress">
        <div className="db-team-progress-label-row">
          <span style={{ color: 'var(--text3)' }}>Close Rate</span>
          <span style={{ color: member.color || '#27057C', fontWeight: 700 }}>{closeRate}%</span>
        </div>
        <div className="db-team-progress-bar-bg">
          <div 
            className="db-team-progress-bar-fill"
            style={{ 
              width: `${progressWidth}%`, 
              backgroundColor: member.color || '#27057C' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ team, leads, activity }) => {
  return (
    <div className="db-section-card db-animate-fade-in" style={{ marginTop: '24px', animationDelay: '200ms' }}>
      <div className="db-section-header">
        <div className="db-section-title-wrap">
          <span className="db-section-icon">👥</span>
          <span className="db-section-title">Team Performance</span>
        </div>
      </div>
      <div className="db-section-body" id="dash-team" style={{ padding: '24px' }}>
        <div className="db-team-list">
          {team.map((m) => {
            const assigned = leads.filter((l) => l.assignee === m.name).length;
            const acts = activity.filter((a) => a.by === m.name).length;
            const closed = leads.filter((l) => l.assignee === m.name && l.stage === 'closed').length;
            return (
              <TeamRow
                key={m.id}
                member={m}
                assigned={assigned}
                acts={acts}
                closed={closed}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;
