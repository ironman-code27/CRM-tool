import React, { useState, useEffect } from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { createLead, updateLead } from '../services/leadsService';

interface LeadModalProps {
  leads: Lead[];
  team: TeamMember[];
  editId: string | null;
  triggerSave: any;
  close: () => void;
  setCurrentView: any;
  setCurrentDetailId: any;
  /** Optional toast callback — used to surface a non-blocking "cloud sync failed" message. */
  toast?: (msg: string) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  leads,
  team,
  editId,
  triggerSave,
  close,
  setCurrentView,
  setCurrentDetailId,
  toast,
}) => {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [stage, setStage] = useState('new');
  const [assignee, setAssignee] = useState('');
  const [cyber, setCyber] = useState(false);
  const [cloud, setCloud] = useState(false);
  const [saas, setSaas] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editId) {
      const l = leads.find((x) => x.id === editId);
      if (l) {
        setFname(l.fname || '');
        setLname(l.lname || '');
        setTitle(l.title || '');
        setCompany(l.company || '');
        setEmail(l.email || '');
        setCountry(l.country || '');
        setStage(l.stage || 'new');
        setAssignee(l.assignee || '');
        setCyber((l.services || []).includes('cyber'));
        setCloud((l.services || []).includes('cloud'));
        setSaas((l.services || []).includes('saas'));
        setNotes(l.notes || '');
      }
    }
  }, [editId, leads]);

  const handleSave = () => {
    if (!fname.trim() || !lname.trim()) {
      window.alert('First and last name are required.');
      return;
    }

    const svcs: ('cyber' | 'cloud' | 'saas')[] = [];
    if (cyber) svcs.push('cyber');
    if (cloud) svcs.push('cloud');
    if (saas) svcs.push('saas');

    // Supabase promise — assigned in each branch and fired after close()
    let supabaseOp: Promise<{ success: boolean; error?: string }>;

    if (editId) {
      // Build the patch object once — used for both triggerSave and Supabase
      const patch: Partial<Lead> = {
        fname: fname.trim(),
        lname: lname.trim(),
        title: title.trim(),
        company: company.trim(),
        email: email.trim(),
        country: country.trim(),
        stage: stage as Lead['stage'],
        assignee,
        services: svcs,
        notes: notes.trim(),
      };

      // 1. Update React state + localStorage immediately (unchanged behaviour)
      const nextLeads = leads.map((l) =>
        l.id === editId ? { ...l, ...patch } : l
      );
      triggerSave({ leads: nextLeads });
      setCurrentDetailId(editId);

      // 2. Queue Supabase update (will run after close())
      supabaseOp = updateLead(editId, patch);
    } else {
      const newLead: Lead = {
        id: 'l' + Date.now(),
        fname: fname.trim(),
        lname: lname.trim(),
        title: title.trim(),
        company: company.trim(),
        email: email.trim(),
        country: country.trim(),
        stage: stage as Lead['stage'],
        assignee,
        services: svcs,
        notes: notes.trim(),
        channels: [],
        created: new Date().toISOString().slice(0, 10),
      };

      // 1. Update React state + localStorage immediately (unchanged behaviour)
      triggerSave({ leads: [...leads, newLead] });
      setCurrentView('leads');

      // 2. Queue Supabase insert (will run after close())
      supabaseOp = createLead(newLead);
    }

    // Close the modal immediately — UI is never blocked by the network call
    close();

    // Handle Supabase result non-blockingly
    supabaseOp.then((result) => {
      if (!result.success) {
        console.warn('[LeadModal] Supabase sync failed:', result.error);
        toast?.('Saved locally — cloud sync failed');
      }
    });
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {editId ? ' Edit lead' : ' Add new lead'}
        </h2>
        <div className="form-row">
          <div className="form-group">
            <label>First name</label>
            <input type="text" value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Jane" />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input type="text" value={lname} onChange={(e) => setLname(e.target.value)} placeholder="Smith" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Job title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CTO" />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Ltd" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="closed">Closed</option>
            </select>
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
            <label>Services interested in</label>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" checked={cyber} onChange={(e) => setCyber(e.target.checked)} /> Cybersecurity
              </label>
              <label>
                <input type="checkbox" checked={cloud} onChange={(e) => setCloud(e.target.checked)} /> IT / Cloud
              </label>
              <label>
                <input type="checkbox" checked={saas} onChange={(e) => setSaas(e.target.checked)} /> Software / SaaS
              </label>
            </div>
          </div>
        </div>
        <div className="form-row full">
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why TekXera? Any context…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save lead</button>
        </div>
      </div>
    </div>
  );
};
export default LeadModal;
