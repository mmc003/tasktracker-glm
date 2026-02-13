import { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskStatus } from '../types/Task';
import { features } from '../config/features';
import './TaskModal.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  startEditing?: boolean;
}

const statusColors: Record<Task['status'], { bg: string; label: string }> = {
  'todo': { bg: '#3b82f6', label: 'To Do' },
  'in-progress': { bg: '#f59e0b', label: 'In Progress' },
  'in-review': { bg: '#8b5cf6', label: 'In Review' },
  'done': { bg: '#22c55e', label: 'Done' },
};

export function TaskModal({ task, onClose, onDelete, onUpdate, startEditing = false }: TaskModalProps) {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee: task.assignee || '',
    dueDate: task.dueDate || '',
  });

  const statusStyle = statusColors[task.status];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title: editForm.title,
      description: editForm.description || undefined,
      status: editForm.status,
      priority: editForm.priority,
      assignee: editForm.assignee || undefined,
      dueDate: editForm.dueDate || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || '',
      dueDate: task.dueDate || '',
    });
    setIsEditing(false);
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

        {isEditing ? (
          <>
            <div className="modal-body">
              <div className="modal-section">
                <span className="modal-label">Title</span>
                <input
                  type="text"
                  className="modal-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="modal-section">
                <span className="modal-label">Description</span>
                <textarea
                  className="modal-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="modal-grid">
                <div className="modal-section">
                  <span className="modal-label">Status</span>
                  <select
                    className="modal-select"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="modal-section">
                  <span className="modal-label">Priority</span>
                  <select
                    className="modal-select"
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="modal-grid">
                {features.assignees && (
                  <div className="modal-section">
                    <span className="modal-label">Assignee</span>
                    <input
                      type="text"
                      className="modal-input"
                      value={editForm.assignee}
                      onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                    />
                  </div>
                )}
                <div className="modal-section">
                  <span className="modal-label">Due Date</span>
                  <input
                    type="date"
                    className="modal-input"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          </>
        ) : (
          <>
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
                {features.assignees && (
                  <div className="modal-section">
                    <span className="modal-label">Assignee</span>
                    <span className="modal-value">{task.assignee || 'Unassigned'}</span>
                  </div>
                )}
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
              <button className="modal-edit-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
