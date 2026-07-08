import React from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';

interface LeadInfoProps {
  lead: Lead;
  team: TeamMember[];
  handleUpdateStage: (stage: string) => void;
  handleUpdateAssignee: (assignee: string) => void;
}

export const LeadInfo: React.FC<LeadInfoProps> = ({
  lead,
  team,
  handleUpdateStage,
  handleUpdateAssignee,
}) => {
  return (
    <div className="card" style={{ marginBottom: '14px' }}>
      <div className="card-header">
        <span className="card-header-title">Contact details</span>
      </div>
      <div className="card-body" style={{ padding: '0 18px' }}>
        <div className="info-row">
          <span className="info-label">Email</span>
          <a href={`mailto:${lead.email}`} style={{ color: '#1B3FAB', fontSize: '13px', textDecoration: 'none' }}>
            {lead.email}
          </a>
        </div>
        <div className="info-row">
          <span className="info-label">Stage</span>
          <select
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '12px',
              padding: '4px 8px',
            }}
            value={lead.stage}
            onChange={(e) => handleUpdateStage(e.target.value)}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="info-row">
          <span className="info-label">Assigned to</span>
          <select
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '12px',
              padding: '4px 8px',
            }}
            value={lead.assignee}
            onChange={(e) => handleUpdateAssignee(e.target.value)}
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="info-row" style={{ alignItems: 'flex-start' }}>
          <span className="info-label">Notes</span>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
            {lead.notes || 'No notes.'}
          </div>
        </div>
        <div className="info-row">
          <span className="info-label">Added</span>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{lead.created || '—'}</span>
        </div>
      </div>
    </div>
  );
};
export default LeadInfo;
