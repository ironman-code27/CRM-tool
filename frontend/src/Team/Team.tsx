import React from 'react';
import { useCRM } from '../context/CRMContext';
import TeamList from './TeamList';

export const TeamPage: React.FC = () => {
  const { team, leads, activity, triggerSave, setActiveModal, toast } = useCRM();

  const handleRemoveMember = (id: string) => {
    const member = team.find((m) => m.id === id);
    if (!member) return;

    if (team.length <= 1) {
      window.alert('You need at least one team member.');
      return;
    }

    if (!window.confirm(`Remove ${member.name} from the team?`)) return;

    const nextTeam = team.filter((x) => x.id !== id);
    const nextLeads = leads.map((l) => (l.assignee === member.name ? { ...l, assignee: '' } : l));

    triggerSave({ team: nextTeam, leads: nextLeads });
    toast(`${member.name} removed`);
  };

  const handleAddMember = () => {
    setActiveModal('team');
  };

  return (
    <div id="view-team" className="view active">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>Team members</div>
        <button className="btn btn-primary btn-sm" onClick={handleAddMember}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add member
        </button>
      </div>

      {/* Team Cards Grid / List */}
      <TeamList
        team={team}
        leads={leads}
        activity={activity}
        handleRemoveMember={handleRemoveMember}
      />
    </div>
  );
};
export default TeamPage;
