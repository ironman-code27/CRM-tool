import React from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { fullName, nameInitials } from '../utils/helpers';

interface PipelineCardProps {
  lead: Lead;
  teamMember?: TeamMember;
  channels: ('linkedin' | 'email' | 'phone' | 'event')[];
  onClick: () => void;
}

const channelIcons = {
  linkedin: 'LI',
  email: 'EM',
  phone: 'PH',
  event: 'EV',
};

const serviceLabels = {
  cyber: 'Cyber',
  cloud: 'Cloud',
  saas: 'SaaS',
};

const serviceClassNames = {
  cyber: 'tag tag-cyber',
  cloud: 'tag tag-cloud',
  saas: 'tag tag-saas',
};

export const PipelineCard: React.FC<PipelineCardProps> = ({
  lead,
  teamMember,
  channels,
  onClick,
}) => {
  const negCount = (lead.comments || []).filter((c) => c.sentiment === 'negative').length;
  const totalComments = (lead.comments || []).length;

  return (
    <div className="lead-card" onClick={onClick}>
      <div className="lc-name">{fullName(lead)}</div>
      <div className="lc-sub">
        {lead.title} · {lead.company}
      </div>
      <div className="lc-tags">
        {(lead.services || []).map((s) => (
          <span key={s} className={serviceClassNames[s]}>
            {serviceLabels[s]}
          </span>
        ))}
      </div>
      <div className="lc-footer">
        {lead.assignee ? (
          <div className="lc-assignee">
            <div
              style={{
                width: '18px',
                height: '18px',
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
              {nameInitials(lead.assignee)}
            </div>
            {lead.assignee}
          </div>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {totalComments > 0 ? (
            <span className="comment-count-sm">
              {negCount > 0 ? <span className="neg-dot" /> : null}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="11"
                height="11"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {totalComments}
            </span>
          ) : null}
          <div className="lc-channels">
            {channels.map((ch) => {
              const chClass = {
                linkedin: 'ch-li',
                email: 'ch-em',
                phone: 'ch-ph',
                event: 'ch-ev',
              }[ch] || '';
              const title = {
                linkedin: 'LinkedIn',
                email: 'Email',
                phone: 'Phone',
                event: 'Event',
              }[ch] || '';
              return (
                <div key={ch} className={`channel-dot ${chClass}`} title={title}>
                  {channelIcons[ch] || '?'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PipelineCard;
