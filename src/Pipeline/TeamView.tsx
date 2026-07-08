import React from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { fullName, nameInitials } from '../utils/helpers';

interface TeamViewProps {
  team: TeamMember[];
  leads: Lead[];
  activeMemberFilter: string;
  openCommentLeadId: string | null;
  setOpenCommentLeadId: (id: string | null) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  team,
  leads,
  activeMemberFilter,
  openCommentLeadId,
  setOpenCommentLeadId,
}) => {
  return (
    <div id="pipeline-board-team">
      <div className="team-pipeline">
        {team
          .filter((m) => activeMemberFilter === 'all' || m.name === activeMemberFilter)
          .map((m) => {
            const memberLeads = leads.filter((l) => l.assignee === m.name);
            return (
              <div key={m.id} className="tp-col">
                <div className="tp-col-hdr">
                  <div
                    className="tp-member-avatar"
                    style={{ background: `${m.color}22`, color: m.color }}
                  >
                    {nameInitials(m.name)}
                  </div>
                  <div>
                    <div className="tp-member-name">{m.name}</div>
                    <div className="tp-member-role">
                      {memberLeads.length} lead{memberLeads.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="tp-cards">
                  {memberLeads.length ? (
                    memberLeads.map((l) => {
                      const negCount = (l.comments || []).filter((c) => c.sentiment === 'negative').length;
                      const totalComments = (l.comments || []).length;
                      const isOpen = openCommentLeadId === l.id;

                      return (
                        <div
                          key={l.id}
                          className={`tp-card ${isOpen ? 'lead-card' : ''}`}
                          style={isOpen ? { borderColor: '#1B3FAB' } : {}}
                          onClick={() => setOpenCommentLeadId(isOpen ? null : l.id)}
                        >
                          <div className="tp-card-name">{fullName(l)}</div>
                          <div className="tp-card-sub">{l.company}</div>
                          <div className="tp-card-footer">
                            <span
                              className={`stage-pill ${{
                                new: 'sp-new',
                                contacted: 'sp-contacted',
                                qualified: 'sp-qualified',
                                closed: 'sp-closed',
                              }[l.stage] || 'sp-new'}`}
                            >
                              {l.stage.charAt(0).toUpperCase() + l.stage.slice(1)}
                            </span>
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
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text3)', padding: '8px 4px', textAlign: 'center' }}>
                      No leads assigned
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
export default TeamView;
