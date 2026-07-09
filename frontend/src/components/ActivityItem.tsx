import React from 'react';
import type { Activity } from '../types/Activity';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { fullName, channelLabel, nameInitials } from '../utils/helpers';

interface ActivityItemProps {
  activity: Activity;
  lead?: Lead;
  teamMember?: TeamMember;
  showLeadLink?: boolean;
  onLeadClick?: (leadId: string) => void;
  variant?: 'dashboard' | 'timeline' | 'log';
}

const channelIcons: Record<string, string> = {
  linkedin: 'LI',
  email: 'EM',
  phone: 'PH',
  event: 'EV',
};

const channelColorVars: Record<string, string> = {
  linkedin: 'blue',
  email: 'teal',
  phone: 'green',
  event: 'purple',
};

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  lead,
  teamMember,
  showLeadLink = false,
  onLeadClick,
  variant = 'log',
}) => {
  const icon = channelIcons[activity.channel] || '?';
  const colorVar = channelColorVars[activity.channel] || 'text3';

  if (variant === 'dashboard') {
    return (
      <div className="activity-item">
        <div
          className="activity-icon"
          style={{
            background: `var(--${colorVar}-bg)`,
            color: `var(--${colorVar})`,
          }}
        >
          {icon}
        </div>
        <div>
          <div className="activity-meta">
            {activity.date} · {activity.by || 'Unknown'} · {channelLabel(activity.channel)}
          </div>
          <div className="activity-text">
            {lead ? `${fullName(lead)} (${lead.company})` : 'Unknown lead'}
          </div>
          {activity.outcome ? <div className="activity-notes">{activity.outcome}</div> : null}
        </div>
      </div>
    );
  }

  // Timeline (details page) and Log variants
  return (
    <div className="activity-item">
      <div
        className="activity-icon"
        style={{
          background: `var(--${colorVar}-bg)`,
          color: `var(--${colorVar})`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div className="activity-meta">
          {activity.date} · {channelLabel(activity.channel)}
        </div>
        <div className="activity-text" style={{ fontWeight: 500 }}>
          {lead ? (
            showLeadLink && onLeadClick ? (
              <span
                style={{ cursor: 'pointer', color: '#1B3FAB' }}
                onClick={() => onLeadClick(lead.id)}
              >
                {fullName(lead)}
              </span>
            ) : (
              fullName(lead)
            )
          ) : (
            'Unknown lead'
          )}
          {lead ? ` · ${lead.company}` : ''}
        </div>
        {activity.outcome ? <div className="activity-notes">{activity.outcome}</div> : null}
        {activity.notes ? (
          <div className="activity-notes" style={{ marginTop: '2px' }}>
            {activity.notes}
          </div>
        ) : null}
      </div>
      {variant === 'log' && activity.by ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text3)' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: teamMember ? `${teamMember.color}22` : 'var(--bg4)',
              color: teamMember ? teamMember.color : 'var(--text3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 800,
            }}
          >
            {nameInitials(activity.by)}
          </div>
          {activity.by}
        </div>
      ) : null}
    </div>
  );
};
export default ActivityItem;
