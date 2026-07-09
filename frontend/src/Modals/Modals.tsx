import React from 'react';
import { useCRM } from '../context/CRMContext';
import SyncModal from './SyncModal';
import UploadModal from './UploadModal';
import LeadModal from '../Leads/LeadModal';
import ActivityModal from '../Activity/ActivityModal';
import TaskModal from '../Tasks/TaskModal';
import TeamModal from '../Team/TeamModal';

export const Modals: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    leads,
    tasks,
    activity,
    team,
    triggerSave,
    editLeadId,
    preselectedLeadId,
    uploadResultsHtml,
    binId,
    setBinId,
    binKey,
    setBinKey,
    reloadFromCloud,
    setSyncState,
    setCurrentView,
    setCurrentDetailId,
    toast,
  } = useCRM();

  if (!activeModal) return null;

  return (
    <>
      {/* ── 1. LEAD MODAL ── */}
      {activeModal === 'lead' && (
        <LeadModal
          leads={leads}
          team={team}
          editId={editLeadId}
          triggerSave={triggerSave}
          close={() => setActiveModal(null)}
          setCurrentView={setCurrentView}
          setCurrentDetailId={setCurrentDetailId}
          toast={toast}
        />
      )}

      {/* ── 2. ACTIVITY MODAL ── */}
      {activeModal === 'activity' && (
        <ActivityModal
          leads={leads}
          team={team}
          activity={activity}
          preselectedLeadId={preselectedLeadId}
          triggerSave={triggerSave}
          close={() => setActiveModal(null)}
          toast={toast}
        />
      )}

      {/* ── 3. TASK MODAL ── */}
      {activeModal === 'task' && (
        <TaskModal
          leads={leads}
          team={team}
          tasks={tasks}
          preselectedLeadId={preselectedLeadId}
          triggerSave={triggerSave}
          close={() => setActiveModal(null)}
          toast={toast}
        />
      )}

      {/* ── 4. TEAM MODAL ── */}
      {activeModal === 'team' && (
        <TeamModal
          team={team}
          triggerSave={triggerSave}
          close={() => setActiveModal(null)}
          toast={toast}
        />
      )}

      {/* ── 5. SYNC MODAL ── */}
      {activeModal === 'sync' && (
        <SyncModal
          binId={binId}
          binKey={binKey}
          setBinId={setBinId}
          setBinKey={setBinKey}
          reloadFromCloud={reloadFromCloud}
          setSyncState={setSyncState}
          leads={leads}
          tasks={tasks}
          activity={activity}
          team={team}
          close={() => setActiveModal(null)}
          toast={toast}
        />
      )}

      {/* ── 6. UPLOAD RESULTS MODAL ── */}
      {activeModal === 'upload' && (
        <UploadModal
          uploadResultsHtml={uploadResultsHtml}
          close={() => setActiveModal(null)}
        />
      )}
    </>
  );
};




export default Modals;
