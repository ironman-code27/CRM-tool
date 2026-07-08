import React, { useState } from 'react';
import type { TeamMember } from '../types/TeamMember';
import { COLORS } from '../constants/seedData';

interface TeamModalProps {
  team: TeamMember[];
  triggerSave: any;
  close: () => void;
  toast: any;
}

export const TeamModal: React.FC<TeamModalProps> = ({ team, triggerSave, close, toast }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      window.alert('Please enter a name.');
      return;
    }

    if (team.find((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      window.alert('A team member with this name already exists.');
      return;
    }

    const color = COLORS[team.length % COLORS.length];
    const newM = {
      id: 'u' + Date.now(),
      name: trimmed,
      color,
    };

    triggerSave({ team: [...team, newM] });
    toast(`${trimmed} added to team`);
    close();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Add team member
        </h2>
        <div className="form-row full">
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add member</button>
        </div>
      </div>
    </div>
  );
};
export default TeamModal;
