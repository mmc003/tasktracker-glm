import type { Task } from '../types/Task';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

export function TaskCard({ task, onDelete, onDragStart, onDragEnd }: TaskCardProps) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <span className={`priority-indicator ${task.priority}`} />
        <button className="delete-btn" onClick={() => onDelete(task.id)}>
          ×
        </button>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-description">{task.description}</p>}
      {task.assignee && <div className="task-assignee">@{task.assignee}</div>}
    </div>
  );
}
