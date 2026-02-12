import { useState, useEffect } from 'react';
import type { Task } from '../types/Task';
import { ContextMenu } from './ContextMenu';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onOpenModal: (task: Task) => void;
  onOpenModalEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
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

export function TaskCard({ task, onDragStart, onDragEnd, onOpenModal, onOpenModalEdit, onDelete, onImmediateDelete }: TaskCardProps) {
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

  return (
    <>
      <div
        className={`task-card ${showDeleteStyle ? 'shift-hover' : ''}`}
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
        {task.assignee && <div className="task-assignee">@{task.assignee}</div>}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
