import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import TaskList from './TaskList';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    leads,
    team,
    triggerSave,
    setActiveModal,
    setPreselectedLeadId,
  } = useCRM();

  // 1. Group tasks: open (sorted by due ascending) vs completed
  const openTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.done)
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.done);
  }, [tasks]);

  // 2. Toggle Handler
  const handleToggleTask = (id: string) => {
    const nextTasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    triggerSave({ tasks: nextTasks });
  };

  const handleAddTask = () => {
    setPreselectedLeadId(null);
    setActiveModal('task');
  };

  return (
    <div id="view-tasks" className="view active">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>Tasks</div>
        <button className="btn btn-primary btn-sm" onClick={handleAddTask}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add task
        </button>
      </div>

      {/* Tasks List */}
      <TaskList
        openTasks={openTasks}
        completedTasks={completedTasks}
        leads={leads}
        team={team}
        handleToggleTask={handleToggleTask}
      />
    </div>
  );
};
export default TasksPage;
