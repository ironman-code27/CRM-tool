import React from 'react';
import type { Task } from '../types/Task';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { fullName } from '../utils/helpers';

interface TaskItemProps {
  task: Task;
  lead?: Lead;
  teamMember?: TeamMember;
  onToggle: (taskId: string) => void;
  variant?: 'dashboard' | 'list';
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  lead,
  teamMember,
  onToggle,
  variant = 'list',
}) => {
  if (variant === 'dashboard') {
    return (
      <div className="task-item">
        <input
          type="checkbox"
          className="task-cb"
          checked={task.done}
          onChange={() => onToggle(task.id)}
        />
        <div className="task-text-wrap">
          <div className={`task-text ${task.done ? 'done' : ''}`}>{task.text}</div>
          <div className="task-meta">
            {task.due || 'No date'} · {task.assignee || 'Unassigned'}
            {lead ? ` · ${fullName(lead)}` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-item">
      <input
        type="checkbox"
        className="task-cb"
        checked={task.done}
        onChange={() => onToggle(task.id)}
      />
      <div className="task-text-wrap">
        <div className={`task-text ${task.done ? 'done' : ''}`}>{task.text}</div>
        <div className="task-meta">
          {task.due || 'No date'}
          {task.assignee ? (
            <>
              {' · '}
              <span style={{ color: teamMember ? teamMember.color : 'var(--text3)' }}>
                {task.assignee}
              </span>
            </>
          ) : null}
          {lead ? ` · ${fullName(lead)} (${lead.company})` : ''}
        </div>
      </div>
    </div>
  );
};
export default TaskItem;
