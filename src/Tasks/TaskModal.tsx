import React, { useState, useEffect } from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import type { Task } from '../types/Task';
import { fullName } from '../utils/helpers';

interface TaskModalProps {
  leads: Lead[];
  team: TeamMember[];
  tasks: Task[];
  preselectedLeadId: string | null;
  triggerSave: any;
  close: () => void;
  toast: any;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  leads,
  team,
  tasks,
  preselectedLeadId,
  triggerSave,
  close,
  toast,
}) => {
  const [text, setText] = useState('');
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [assignee, setAssignee] = useState('');
  const [leadId, setLeadId] = useState(preselectedLeadId || '');

  useEffect(() => {
    setLeadId(preselectedLeadId || '');
  }, [preselectedLeadId]);

  const handleSave = () => {
    if (!text.trim()) {
      window.alert('Please enter a task description.');
      return;
    }

    const newT = {
      id: 't' + Date.now(),
      text: text.trim(),
      due,
      assignee,
      leadId,
      done: false,
    };

    triggerSave({ tasks: [...tasks, newT] });
    toast('Task added');
    close();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Add task
        </h2>
        <div className="form-row full">
          <div className="form-group">
            <label>Task description</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Follow up with David Higgins at Eftsure"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Due date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Assigned to</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row full">
          <div className="form-group">
            <label>Link to lead (optional)</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">— no lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {fullName(l)} · {l.company}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save task</button>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;
