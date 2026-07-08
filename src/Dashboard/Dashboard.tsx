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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <RecentActivity recentActivities={recentActivities} leads={leads} />

        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Open tasks</span>
          </div>
          <div className="card-body" id="dash-tasks" style={{ padding: '12px 16px' }}>
            {openTasks.length ? (
              openTasks.map((t) => {
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
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                No open tasks
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
