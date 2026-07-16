import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import TaskItem from '../components/TaskItem';
import { initials, fullName, avatarColor } from '../utils/helpers';
import { COLORS } from '../constants/seedData';
import LeadInfo from './LeadInfo';
import Timeline from './Timeline';
import Notes from './Notes';
import type { PipelineStage } from '../types/PipelineStage';
import { deleteLead, updateLead } from '../services/leadsService';

const serviceLabels = {
  cyber: 'Cyber',
  cloud: 'Cloud',
  saas: 'SaaS',
  pmaas: 'PMaaS',
};

const serviceClassNames = {
  cyber: 'tag tag-cyber',
  cloud: 'tag tag-cloud',
  saas: 'tag tag-saas',
  pmaas: 'tag tag-pmaas',
};

const channelIcons = {
  linkedin: 'LI',
  email: 'EM',
  phone: 'PH',
  event: 'EV',
};

export const LeadDetail: React.FC = () => {
  const {
    leads,
    tasks,
    activity,
    team,
    currentDetailId,
    setCurrentView,
    triggerSave,
    setActiveModal,
    setEditLeadId,
    setPreselectedLeadId,
    detailCommentSentiment,
    setDetailCommentSentiment,
    toast,
  } = useCRM();

  // 1. Fetch current lead
  const lead = useMemo(() => {
    return leads.find((l) => l.id === currentDetailId) || null;
  }, [leads, currentDetailId]);

  // 2. Fetch lead activities and tasks
  const leadActs = useMemo(() => {
    return [...activity.filter((a) => a.leadId === (lead ? lead.id : ''))].sort((a, b) => b.date.localeCompare(a.date));
  }, [activity, lead]);

  const leadTasks = useMemo(() => {
    return tasks.filter((t) => t.leadId === (lead ? lead.id : ''));
  }, [tasks, lead]);

  const usedChannels = useMemo(() => {
    return [...new Set(leadActs.map((a) => a.channel))];
  }, [leadActs]);

  if (!lead) {
    return (
      <div className="view active">
        <button className="back-btn" onClick={() => setCurrentView('pipeline')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to pipeline
        </button>
        <div className="empty-state">Lead not found</div>
      </div>
    );
  }

  // Handlers
  const handleEditLead = () => {
    setEditLeadId(lead.id);
    setActiveModal('lead');
  };

  const handleDeleteLead = () => {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    const nextLeads = leads.filter((x) => x.id !== lead.id);
    // 1. Update React state + localStorage immediately
    triggerSave({ leads: nextLeads });
    setCurrentView('pipeline');
    toast('Lead deleted');

    // 2. Sync deletion to Supabase (non-blocking)
    deleteLead(lead.id).then((result) => {
      if (!result.success) {
        console.warn('[LeadDetail] deleteLead sync failed:', result.error);
        toast('Deleted locally — cloud sync failed');
      }
    });
  };

  const handleUpdateStage = (val: string) => {
    const nextLeads = leads.map((x) => (x.id === lead.id ? { ...x, stage: val as any } : x));
    // 1. Update React state + localStorage immediately
    triggerSave({ leads: nextLeads });
    toast('Stage updated');

    // 2. Sync stage change to Supabase (non-blocking)
    updateLead(lead.id, { stage: val as PipelineStage }).then((result) => {
      if (!result.success) {
        console.warn('[LeadDetail] updateLead (stage) sync failed:', result.error);
        toast('Saved locally — cloud sync failed');
      }
    });
  };

  const handleUpdateAssignee = (val: string) => {
    const nextLeads = leads.map((x) => (x.id === lead.id ? { ...x, assignee: val } : x));
    // 1. Update React state + localStorage immediately
    triggerSave({ leads: nextLeads });
    toast('Assignee updated');

    // 2. Sync assignee change to Supabase (non-blocking)
    updateLead(lead.id, { assignee: val }).then((result) => {
      if (!result.success) {
        console.warn('[LeadDetail] updateLead (assignee) sync failed:', result.error);
        toast('Saved locally — cloud sync failed');
      }
    });
  };

  const handleToggleTask = (id: string) => {
    const nextTasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    triggerSave({ tasks: nextTasks });
  };

  const handleAddTaskClick = () => {
    setPreselectedLeadId(lead.id);
    setActiveModal('task');
  };

  const handleLogActivityClick = () => {
    setPreselectedLeadId(lead.id);
    setActiveModal('activity');
  };

  const leadColor = avatarColor(lead.id, team, COLORS);

  return (
    <div id="view-detail" className="view active">
      {/* Back Button */}
      <button className="back-btn" onClick={() => setCurrentView('pipeline')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to pipeline
      </button>

      <div id="detail-content">
        {/* Header Summary */}
        <div className="detail-hdr">
          <div
            className="detail-avatar"
            style={{
              background: `${leadColor}22`,
              color: leadColor,
            }}
          >
            {initials(lead)}
          </div>
          <div style={{ flex: 1 }}>
            <div className="detail-name">{fullName(lead)}</div>
            <div className="detail-sub">
              {lead.title} · {lead.company} · {lead.country}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(lead.services || []).map((s) => (
                <span key={s} className={serviceClassNames[s]}>
                  {serviceLabels[s]}
                </span>
              ))}
              {usedChannels.map((ch) => {
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
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleEditLead}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteLead}>
              Delete
            </button>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="detail-grid">
          {/* Left Column: Contact details & Tasks */}
          <div>
            <LeadInfo
              lead={lead}
              team={team}
              handleUpdateStage={handleUpdateStage}
              handleUpdateAssignee={handleUpdateAssignee}
            />

            {/* Lead specific Tasks list */}
            <div className="card">
              <div className="card-header">
                <span className="card-header-title">Tasks</span>
                <button className="btn btn-ghost btn-sm" onClick={handleAddTaskClick}>
                  + Add
                </button>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {leadTasks.length ? (
                  leadTasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={handleToggleTask}
                      teamMember={team.find((m) => m.name === t.assignee)}
                      variant="list"
                    />
                  ))
                ) : (
                  <div className="empty-state">No tasks yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline & Comments feedback */}
          <div>
            <Timeline
              leadActs={leadActs}
              handleLogActivityClick={handleLogActivityClick}
            />

            <Notes
              lead={lead}
              team={team}
              leads={leads}
              detailCommentSentiment={detailCommentSentiment}
              setDetailCommentSentiment={setDetailCommentSentiment}
              triggerSave={triggerSave}
              toast={toast}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default LeadDetail;
