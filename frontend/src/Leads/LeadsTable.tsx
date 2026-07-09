import React from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import type { Activity } from '../types/Activity';
import { initials, fullName, nameInitials, avatarColor } from '../utils/helpers';
import { COLORS } from '../constants/seedData';

interface LeadsTableProps {
  leads: Lead[];
  team: TeamMember[];
  activity: Activity[];
  onViewDetail: (id: string) => void;
}

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

const stageClassNames = {
  new: 'sp-new',
  contacted: 'sp-contacted',
  qualified: 'sp-qualified',
  closed: 'sp-closed',
};

const channelIcons = {
  linkedin: 'LI',
  email: 'EM',
  phone: 'PH',
  event: 'EV',
};

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  team,
  activity,
  onViewDetail,
}) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: '190px' }}>Contact</th>
            <th style={{ width: '150px' }}>Company</th>
            <th style={{ width: '100px' }}>Stage</th>
            <th style={{ width: '120px' }}>Services</th>
            <th style={{ width: '120px' }}>Assigned to</th>
            <th style={{ width: '110px' }}>Contacted via</th>
            <th style={{ width: '95px' }}>Date added</th>
            <th style={{ width: '70px' }} />
          </tr>
        </thead>
        <tbody id="leads-tbody">
          {leads.length ? (
            leads.map((l) => {
              const assigneeM = team.find((m) => m.name === l.assignee);
              const leadActs = activity.filter((a) => a.leadId === l.id);
              const chs = [...new Set(leadActs.map((a) => a.channel))];
              const leadColor = avatarColor(l.id, team, COLORS);

              return (
                <tr key={l.id}>
                  {/* Contact Column */}
                  <td>
                    <div className="contact-cell">
                      <div
                        className="avatar"
                        style={{
                          background: `${leadColor}22`,
                          color: leadColor,
                        }}
                      >
                        {initials(l)}
                      </div>
                      <div>
                        <div className="contact-name">{fullName(l)}</div>
                        <div className="contact-title-sm">{l.title}</div>
                      </div>
                    </div>
                  </td>

                  {/* Company Column */}
                  <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{l.company}</td>

                  {/* Stage Column */}
                  <td>
                    <span className={`stage-pill ${stageClassNames[l.stage] || 'sp-new'}`}>
                      {l.stage.charAt(0).toUpperCase() + l.stage.slice(1)}
                    </span>
                  </td>

                  {/* Services Column */}
                  <td>
                    <div className="lc-tags">
                      {(l.services || []).map((s) => (
                        <span key={s} className={serviceClassNames[s]}>
                          {serviceLabels[s]}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Assigned To Column */}
                  <td>
                    {l.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: assigneeM ? `${assigneeM.color}22` : 'var(--bg4)',
                            color: assigneeM ? assigneeM.color : 'var(--text3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: 800,
                          }}
                        >
                          {nameInitials(l.assignee)}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{l.assignee}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>—</span>
                    )}
                  </td>

                  {/* Contacted Via Column */}
                  <td>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {chs.length ? (
                        chs.map((ch) => {
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
                        })
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>None yet</span>
                      )}
                    </div>
                  </td>

                  {/* Date Added Column */}
                  <td style={{ fontSize: '11px', color: 'var(--text2)' }}>
                    {l.created || '—'}
                  </td>

                  {/* Action Column */}
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => onViewDetail(l.id)}>
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  No leads match filters
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default LeadsTable;
