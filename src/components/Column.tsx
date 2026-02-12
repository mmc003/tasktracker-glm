import { useRef } from 'react';
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
  const columnRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnter(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger leave if we're actually leaving the column (not entering a child)
    if (columnRef.current && !columnRef.current.contains(e.relatedTarget as Node)) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(status);
  };

  return (
    <div
      ref={columnRef}
      className={`column ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="column-content">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
