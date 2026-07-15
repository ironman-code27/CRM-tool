import React from 'react';
import { useCRM } from '../context/CRMContext';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import TeamPerformance from './TeamPerformance';
import TaskItem from '../components/TaskItem';

export const Dashboard: React.FC = () => {
  const { leads, tasks, activity, team, triggerSave } = useCRM();

  // 1. Calculate stats counts
  const counts = { new: 0, contacted: 0, qualified: 0, closed: 0 };
  leads.forEach((l) => {
    if (l.stage === 'new' || l.stage === 'contacted' || l.stage === 'qualified' || l.stage === 'closed') {
      counts[l.stage]++;
    }
  });

  const openTasksCount = tasks.filter((t) => !t.done).length;

  // 2. Fetch sorted recent activity
  const recentActivities = [...activity]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // 3. Fetch sorted open tasks
  const openTasks = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  // 4. Toggle Task Completion
  const handleToggleTask = (id: string) => {
    const nextTasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    triggerSave({ tasks: nextTasks });
  };

  const { setCurrentView } = useCRM();

  return (
    <div id="view-dashboard" className="view active">
      {/* Statistics Grid */}
      <DashboardStats
        leadsCount={leads.length}
        newCount={counts.new}
        contactedCount={counts.contacted}
        qualifiedCount={counts.qualified}
        closedCount={counts.closed}
        activitiesCount={activity.length}
        openTasksCount={openTasksCount}
      />

      {/* Split Cards: Recent Activity & Open Tasks */}
      <div className="db-split-grid">
        <RecentActivity recentActivities={recentActivities} leads={leads} />

        <div className="db-section-card db-animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="db-section-header">
            <div className="db-section-title-wrap">
              <span className="db-section-icon">✅</span>
              <span className="db-section-title">Open Tasks</span>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentView('tasks')}
              style={{ borderRadius: '8px', fontSize: '12px' }}
            >
              View all
            </button>
          </div>
          <div className="db-section-body" id="dash-tasks" style={{ padding: '20px 24px' }}>
            {openTasks.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {openTasks.map((t) => {
                  const lead = leads.find((x) => x.id === t.leadId);
                  return (
                    <TaskItem
                      key={t.id}
                      task={t}
                      lead={lead}
                      onToggle={handleToggleTask}
                      variant="dashboard"
                    />
                  );
                })}
              </div>
            ) : (
              <div className="db-empty-state">
                <div className="db-empty-icon">🎉</div>
                <div className="db-empty-text">No open tasks</div>
                <div className="db-empty-subtext">You're all caught up! New tasks will show here.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance Grid */}
      <TeamPerformance team={team} leads={leads} activity={activity} />
    </div>
  );
};
export default Dashboard;
