import { useRef, useState } from 'react';
import type { Task, TaskStatus } from '../types/Task';
import { TaskCard } from './TaskCard';
import './Column.css';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  draggedTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (status: TaskStatus) => void;
  onOpenModal: (task: Task) => void;
  onOpenModalEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onImmediateDelete: (taskId: string) => void;
}

export function Column({
  title,
  status,
  tasks,
  draggedTaskId,
  onDragStart,
  onDragEnd,
  onDrop,
  onOpenModal,
  onOpenModalEdit,
  onDelete,
  onDuplicate,
  onImmediateDelete,
}: ColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    onDrop(status);
  };

  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        className={`column-content ${isDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggedTaskId === task.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onOpenModal={onOpenModal}
            onOpenModalEdit={onOpenModalEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onImmediateDelete={onImmediateDelete}
          />
        ))}
        {tasks.length === 0 && <div className="column-placeholder">Drop tasks here</div>}
      </div>
    </div>
  );
}
