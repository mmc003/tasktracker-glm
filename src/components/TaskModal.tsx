import type { Task } from '../types/Task';
import './TaskModal.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => void;
}

const statusColors: Record<Task['status'], { bg: string; label: string }> = {
  'todo': { bg: '#3b82f6', label: 'To Do' },
  'in-progress': { bg: '#f59e0b', label: 'In Progress' },
  'in-review': { bg: '#8b5cf6', label: 'In Review' },
  'done': { bg: '#22c55e', label: 'Done' },
};

export function TaskModal({ task, onClose, onDelete }: TaskModalProps) {
  const statusStyle = statusColors[task.status];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-status" style={{ backgroundColor: statusStyle.bg }}>
            {statusStyle.label}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <h2 className="modal-title">{task.title}</h2>

        <div className="modal-body">
          {task.description && (
            <div className="modal-section">
              <span className="modal-label">Description</span>
              <p className="modal-description">{task.description}</p>
            </div>
          )}

          <div className="modal-grid">
            <div className="modal-section">
              <span className="modal-label">Priority</span>
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            </div>
            <div className="modal-section">
              <span className="modal-label">Assignee</span>
              <span className="modal-value">{task.assignee || 'Unassigned'}</span>
            </div>
          </div>

          <div className="modal-grid">
            <div className="modal-section">
              <span className="modal-label">Due Date</span>
              <span className="modal-value date">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'No due date'}
              </span>
            </div>
            <div className="modal-section">
              <span className="modal-label">Created</span>
              <span className="modal-value date">
                {new Date(task.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-delete-btn" onClick={handleDelete}>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
