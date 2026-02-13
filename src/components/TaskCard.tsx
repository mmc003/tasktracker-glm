import { useState, useEffect } from 'react';
import type { Task } from '../types/Task';
import { ContextMenu } from './ContextMenu';
import { features } from '../config/features';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onOpenModal: (task: Task) => void;
  onOpenModalEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onImmediateDelete: (taskId: string) => void;
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

export function TaskCard({ task, isDragging, onDragStart, onDragEnd, onOpenModal, onOpenModalEdit, onDelete, onDuplicate, onImmediateDelete }: TaskCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(task.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (contextMenu) {
      setContextMenu(null);
      return;
    }
    if (e.shiftKey) {
      onImmediateDelete(task.id);
    } else {
      onOpenModal(task);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEdit = () => {
    setContextMenu(null);
    onOpenModalEdit(task);
  };

  const handleDelete = () => {
    setContextMenu(null);
    onDelete(task.id);
  };

  const handleDuplicate = () => {
    setContextMenu(null);
    onDuplicate(task.id);
  };

  // Track shift key for visual feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const statusStyle = statusColors[task.status];
  const priorityStyle = priorityColors[task.priority];

  const showDeleteStyle = isShiftHeld && isHovered;

  const formatDueDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr + 'T00:00:00');
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Today', isOverdue: false, isSoon: true };
    if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isSoon: true };
    if (diffDays === -1) return { text: 'Yesterday', isOverdue: true, isSoon: false };
    if (diffDays < -1) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isSoon: false };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { text: `${months[dueDate.getMonth()]} ${dueDate.getDate()}`, isOverdue: false, isSoon: false };
  };

  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <>
      <div
        className={`task-card ${showDeleteStyle ? 'shift-hover' : ''} ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="task-card-header">
          <span className="status-indicator" style={{ backgroundColor: statusStyle.bg }} />
          <span className="status-label" style={{ color: statusStyle.bg }}>{statusStyle.label}</span>
          <span className={`priority-tag ${task.priority}`}>{priorityStyle.label}</span>
        </div>
        <h4 className="task-title">{task.title}</h4>
        <div className="task-card-footer">
          {features.assignees && task.assignee && <span className="task-assignee">@{task.assignee}</span>}
          {dueDateInfo && (
            <span className={`task-due-date ${dueDateInfo.isOverdue ? 'overdue' : ''} ${dueDateInfo.isSoon ? 'soon' : ''}`}>
              {dueDateInfo.text}
            </span>
          )}
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
