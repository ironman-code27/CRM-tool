import React, { useState, useEffect } from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import type { Activity } from '../types/Activity';
import { fullName } from '../utils/helpers';

interface ActivityModalProps {
  leads: Lead[];
  team: TeamMember[];
  activity: Activity[];
  preselectedLeadId: string | null;
  triggerSave: any;
  close: () => void;
  toast: any;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  leads,
  team,
  activity,
  preselectedLeadId,
  triggerSave,
  close,
  toast,
}) => {
  const [leadId, setLeadId] = useState(preselectedLeadId || '');
  const [channel, setChannel] = useState('linkedin');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [by, setBy] = useState('');
  const [outcome, setOutcome] = useState('No response yet');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setLeadId(preselectedLeadId || '');
  }, [preselectedLeadId]);

  useEffect(() => {
    if (team.length && !by) {
      setBy(team[0].name);
    }
  }, [team, by]);

  const handleSave = () => {
    if (!leadId) {
      window.alert('Please select a lead.');
      return;
    }

    const newAct = {
      id: 'a' + Date.now(),
      leadId,
      channel: channel as any,
      date,
      by,
      outcome,
      notes: notes.trim(),
    };

    const updatedLeads = leads.map((l) =>
      l.id === leadId && l.stage === 'new' ? { ...l, stage: 'contacted' } : l
    );

    triggerSave({
      activity: [...activity, newAct],
      leads: updatedLeads,
    });
    toast('Activity logged');
    close();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Log activity
        </h2>
        <div className="form-row full">
          <div className="form-group">
            <label>Lead</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Select a lead…</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {fullName(l)} · {l.company}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="linkedin">💼 LinkedIn message</option>
              <option value="email">✉️ Email</option>
              <option value="phone">📞 Phone call</option>
              <option value="event">🤝 In-person / Event</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Logged by</label>
            <select value={by} onChange={(e) => setBy(e.target.value)}>
              <option value="">Select member…</option>
              {team.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="No response yet">No response yet</option>
              <option value="Responded — interested">Responded — interested</option>
              <option value="Responded — not now">Responded — not now</option>
              <option value="Meeting booked">Meeting booked</option>
              <option value="Proposal sent">Proposal sent</option>
              <option value="Closed — won">Closed — won</option>
              <option value="Closed — lost">Closed — lost</option>
            </select>
          </div>
        </div>
        <div className="form-row full">
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was discussed or sent?" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save activity</button>
        </div>
      </div>
    </div>
  );
};
export default ActivityModal;
