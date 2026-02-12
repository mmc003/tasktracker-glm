import type { Task } from '../types/Task';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onOpenModal: (task: Task) => void;
}

const statusColors: Record<Task['status'], { bg: string; label: string }> = {
  'todo': { bg: '#3b82f6', label: 'To Do' },
  'in-progress': { bg: '#f59e0b', label: 'In Progress' },
  'in-review': { bg: '#8b5cf6', label: 'In Review' },
  'done': { bg: '#22c55e', label: 'Done' },
};

const priorityColors: Record<Task['priority'], { bg: string; label: string }> = {
  'low': { bg: '#22c55e', label: 'Low' },
  'medium': { bg: '#f59e0b', label: 'Medium' },
  'high': { bg: '#ef4444', label: 'High' },
};

export function TaskCard({ task, onDragStart, onDragEnd, onOpenModal }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(task.id);
  };

  const handleClick = () => {
    onOpenModal(task);
  };

  const statusStyle = statusColors[task.status];
  const priorityStyle = priorityColors[task.priority];

  return (
    <div
      className="task-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
    >
      <div className="task-card-header">
        <span className="status-indicator" style={{ backgroundColor: statusStyle.bg }} />
        <span className="status-label" style={{ color: statusStyle.bg }}>{statusStyle.label}</span>
        <span className={`priority-tag ${task.priority}`}>{priorityStyle.label}</span>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.assignee && <div className="task-assignee">@{task.assignee}</div>}
    </div>
  );
}
