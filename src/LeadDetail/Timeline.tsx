import React from 'react';
import type { Activity } from '../types/Activity';
import { channelLabel } from '../utils/helpers';

interface TimelineProps {
  leadActs: Activity[];
  handleLogActivityClick: () => void;
}

const channelIcons = {
  linkedin: 'LI',
  email: 'EM',
  phone: 'PH',
  event: 'EV',
};

export const Timeline: React.FC<TimelineProps> = ({
  leadActs,
  handleLogActivityClick,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">Activity timeline</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogActivityClick}>
          + Log
        </button>
      </div>
      <div className="card-body" style={{ padding: '16px 18px' }}>
        {leadActs.length ? (
          <div className="timeline">
            {leadActs.map((act) => {
              const chClass = {
                linkedin: 'tl-li',
                email: 'tl-em',
                phone: 'tl-ph',
                event: 'tl-ev',
              }[act.channel] || '';

              const icon = channelIcons[act.channel] || '?';
              const colorVar = {
                linkedin: 'blue',
                email: 'teal',
                phone: 'green',
                event: 'purple',
              }[act.channel] || 'text3';

              return (
                <div key={act.id} className={`tl-item ${chClass}`}>
                  <div className="tl-dot" />
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
                        {act.date} · {act.by || 'Unknown'} · {channelLabel(act.channel)}
                      </div>
                      {act.outcome ? <div className="activity-text">{act.outcome}</div> : null}
                      {act.notes ? <div className="activity-notes">{act.notes}</div> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📬</div>
            No activities yet
            <br />
            <span style={{ fontSize: '12px' }}>Log the first touchpoint above</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default Timeline;
