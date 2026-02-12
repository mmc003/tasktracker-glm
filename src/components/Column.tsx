import { useRef, useState } from 'react';
import type { Task, TaskStatus } from '../types/Task';
import { TaskCard } from './TaskCard';
import './Column.css';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (status: TaskStatus) => void;
  onDragEnter: (status: TaskStatus) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  isDragging: boolean;
}

export function Column({
  title,
  status,
  tasks,
  onDelete,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragEnter,
  onDragLeave,
  isDragOver,
  isDragging,
}: ColumnProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [localDragOver, setLocalDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalDragOver(true);
    onDragEnter(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if we're leaving the content area entirely
    const rect = contentRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setLocalDragOver(false);
        onDragLeave();
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDragOver(false);
    onDrop(status);
  };

  const handleDragEnd = () => {
    setLocalDragOver(false);
    onDragEnd();
  };

  return (
    <div className={`column ${isDragging ? 'dragging' : ''}`}>
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        ref={contentRef}
        className={`column-content ${(isDragOver || localDragOver) ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
        {tasks.length === 0 && <div className="column-placeholder">Drop tasks here</div>}
      </div>
    </div>
  );
}
