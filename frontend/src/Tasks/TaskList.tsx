import React from 'react';
import type { Lead } from '../types/Lead';
import type { Task } from '../types/Task';
import type { TeamMember } from '../types/TeamMember';
import TaskItem from '../components/TaskItem';

interface TaskListProps {
  openTasks: Task[];
  completedTasks: Task[];
  leads: Lead[];
  team: TeamMember[];
  handleToggleTask: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  openTasks,
  completedTasks,
  leads,
  team,
  handleToggleTask,
}) => {
  return (
    <div id="tasks-list">
      {/* Open Tasks Section */}
      {openTasks.length ? (
        <>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text3)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
            }}
          >
            Open ({openTasks.length})
          </div>
          {openTasks.map((t) => {
            const lead = leads.find((l) => l.id === t.leadId);
            const member = team.find((m) => m.name === t.assignee);
            return (
              <TaskItem
                key={t.id}
                task={t}
                lead={lead}
                teamMember={member}
                onToggle={handleToggleTask}
                variant="list"
              />
            );
          })}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          No open tasks
        </div>
      )}

      {/* Completed Tasks Section */}
      {completedTasks.length ? (
        <>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text3)',
              margin: '16px 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
            }}
          >
            Completed ({completedTasks.length})
          </div>
          {completedTasks.map((t) => {
            const lead = leads.find((l) => l.id === t.leadId);
            const member = team.find((m) => m.name === t.assignee);
            return (
              <TaskItem
                key={t.id}
                task={t}
                lead={lead}
                teamMember={member}
                onToggle={handleToggleTask}
                variant="list"
              />
            );
          })}
        </>
      ) : null}
    </div>
  );
};
export default TaskList;
