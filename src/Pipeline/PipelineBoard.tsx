import React from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import PipelineCard from './PipelineCard';

interface PipelineBoardProps {
  stages: readonly { readonly key: string; readonly label: string }[];
  visibleLeads: Lead[];
  team: TeamMember[];
  getUsedChannels: (leadId: string) => ('linkedin' | 'email' | 'phone' | 'event')[];
  handleOpenDetail: (id: string) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  stages,
  visibleLeads,
  team,
  getUsedChannels,
  handleOpenDetail,
}) => {
  return (
    <div id="pipeline-board-all">
      <div className="pipeline">
        {stages.map((st) => {
          const colLeads = visibleLeads.filter((l) => l.stage === st.key);
          return (
            <div key={st.key} className={`pipe-col pipe-${st.key}`}>
              <div className="pipe-hdr">
                <span className="pipe-label">{st.label}</span>
                <span className="pipe-count">{colLeads.length}</span>
              </div>
              {colLeads.length ? (
                colLeads.map((l) => {
                  const member = team.find((m) => m.name === l.assignee);
                  return (
                    <PipelineCard
                      key={l.id}
                      lead={l}
                      teamMember={member}
                      channels={getUsedChannels(l.id)}
                      onClick={() => handleOpenDetail(l.id)}
                    />
                  );
                })
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '8px 4px' }}>
                  No leads here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PipelineBoard;
