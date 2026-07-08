import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import PipelineBoard from './PipelineBoard';
import TeamView from './TeamView';
import CommentsPanel from './CommentsPanel';

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'closed', label: 'Closed' },
] as const;

export const Pipeline: React.FC = () => {
  const {
    leads,
    activity,
    team,
    activeMemberFilter,
    setActiveMemberFilter,
    currentPipelineView,
    setCurrentPipelineView,
    openCommentLeadId,
    setOpenCommentLeadId,
    pipelineCommentSentiment,
    setPipelineCommentSentiment,
    triggerSave,
    setCurrentView,
    setCurrentDetailId,
    toast,
  } = useCRM();

  // 1. Filter leads visible on the pipeline
  const visibleLeads = useMemo(() => {
    if (activeMemberFilter && activeMemberFilter !== 'all') {
      return leads.filter((l) => l.assignee === activeMemberFilter);
    }
    return leads;
  }, [leads, activeMemberFilter]);

  // 2. Fetch used channels helper
  const getUsedChannels = (leadId: string): ('linkedin' | 'email' | 'phone' | 'event')[] => {
    const acts = activity.filter((a) => a.leadId === leadId);
    return [...new Set(acts.map((a) => a.channel))];
  };

  // 3. Active comment details
  const activeCommentLead = useMemo(() => {
    if (!openCommentLeadId) return null;
    return leads.find((l) => l.id === openCommentLeadId) || null;
  }, [leads, openCommentLeadId]);

  // Handle detailed lead redirection
  const handleOpenDetail = (id: string) => {
    setCurrentDetailId(id);
    setCurrentView('detail');
  };

  return (
    <div id="view-pipeline" className="view active">
      {/* Filters and View Toggle */}
      <div className="pipeline-view-toggle">
        <button
          className={`pvt-btn ${currentPipelineView === 'all' ? 'active' : ''}`}
          onClick={() => setCurrentPipelineView('all')}
        >
          All pipeline
        </button>
        <button
          className={`pvt-btn ${currentPipelineView === 'team' ? 'active' : ''}`}
          onClick={() => setCurrentPipelineView('team')}
        >
          Team view
        </button>

        {/* Member Filter Chips */}
        <div className="member-filter-chips">
          <button
            className={`mf-chip ${activeMemberFilter === 'all' ? 'active' : ''}`}
            style={activeMemberFilter === 'all' ? { background: '#1B3FAB', borderColor: '#1B3FAB' } : {}}
            onClick={() => setActiveMemberFilter('all')}
          >
            All team
          </button>
          {team.map((m) => {
            const active = activeMemberFilter === m.name;
            return (
              <button
                key={m.id}
                className={`mf-chip ${active ? 'active' : ''}`}
                style={active ? { background: m.color, borderColor: m.color } : {}}
                onClick={() => setActiveMemberFilter(m.name)}
              >
                {m.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ALL PIPELINE BOARD ── */}
      {currentPipelineView === 'all' && (
        <PipelineBoard
          stages={STAGES}
          visibleLeads={visibleLeads}
          team={team}
          getUsedChannels={getUsedChannels}
          handleOpenDetail={handleOpenDetail}
        />
      )}

      {/* ── TEAM VIEW PIPELINE ── */}
      {currentPipelineView === 'team' && (
        <TeamView
          team={team}
          leads={leads}
          activeMemberFilter={activeMemberFilter}
          openCommentLeadId={openCommentLeadId}
          setOpenCommentLeadId={setOpenCommentLeadId}
        />
      )}

      {/* ── INLINE COMMENTS PANEL (TEAM PIPELINE) ── */}
      {currentPipelineView === 'team' && activeCommentLead && (
        <CommentsPanel
          activeCommentLead={activeCommentLead}
          team={team}
          leads={leads}
          pipelineCommentSentiment={pipelineCommentSentiment}
          setPipelineCommentSentiment={setPipelineCommentSentiment}
          setOpenCommentLeadId={setOpenCommentLeadId}
          triggerSave={triggerSave}
          toast={toast}
        />
      )}
    </div>
  );
};
export default Pipeline;
