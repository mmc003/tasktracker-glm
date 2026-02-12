import { useRef, useEffect } from 'react';
import type { Task, TaskStatus } from '../types/Task';
import { TaskCard } from './TaskCard';
import './Column.css';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (status: TaskStatus) => void;
  onDragEnter: (status: TaskStatus) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  isDragging: boolean;
  onOpenModal: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function Column({
  title,
  status,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragEnter,
  onDragLeave,
  isDragOver,
  isDragging,
  onOpenModal,
  onDelete,
}: ColumnProps) {
  const dragCounterRef = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      onDragEnter(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    onDrop(status);
  };

  // Reset counter when dragging ends globally
  useEffect(() => {
    if (!isDragging) {
      dragCounterRef.current = 0;
    }
  }, [isDragging]);

  return (
    <div className={`column ${isDragging ? 'dragging' : ''}`}>
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        className={`column-content ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onOpenModal={onOpenModal}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && <div className="column-placeholder">Drop tasks here</div>}
      </div>
    </div>
  );
}
