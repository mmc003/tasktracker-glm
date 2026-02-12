import { useState } from 'react';
import type { Task } from '../types/Task';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

const statusColors: Record<Task['status'], { bg: string; border: string; label: string }> = {
  'todo': { bg: '#3b82f6', border: '#2563eb', label: 'To Do' },
  'in-progress': { bg: '#f59e0b', border: '#d97706', label: 'In Progress' },
  'in-review': { bg: '#8b5cf6', border: '#7c3aed', label: 'In Review' },
  'done': { bg: '#22c55e', border: '#16a34a', label: 'Done' },
};

export function TaskCard({ task, onDelete, onDragStart, onDragEnd }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(task.id);
  };

  const handleClick = () => {
    setExpanded(!expanded);
  };

  const statusStyle = statusColors[task.status];

  return (
    <div
      className={`task-card ${expanded ? 'expanded' : ''}`}
      draggable={!expanded}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-main" onClick={handleClick}>
        <div className="task-card-header">
          <span className="status-indicator" style={{ backgroundColor: statusStyle.bg }} />
          <span className="status-label" style={{ color: statusStyle.bg }}>{statusStyle.label}</span>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            ×
          </button>
        </div>
        <h4 className="task-title">{task.title}</h4>
        {task.assignee && <div className="task-assignee">@{task.assignee}</div>}
        <div className="expand-indicator">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="task-details">
          {task.description && (
            <div className="detail-section">
              <span className="detail-label">Description</span>
              <p className="detail-value">{task.description}</p>
            </div>
          )}
          <div className="detail-row">
            <div className="detail-section">
              <span className="detail-label">Priority</span>
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            </div>
            <div className="detail-section">
              <span className="detail-label">Assignee</span>
              <span className="detail-value">{task.assignee || 'Unassigned'}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-section">
              <span className="detail-label">Created</span>
              <span className="detail-value date">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-section">
              <span className="detail-label">Updated</span>
              <span className="detail-value date">
                {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
