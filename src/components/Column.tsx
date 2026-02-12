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
  onOpenModal: (task: Task) => void;
  onOpenModalEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onImmediateDelete: (taskId: string) => void;
}

export function Column({
  title,
  status,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onOpenModal,
  onOpenModalEdit,
  onDelete,
  onImmediateDelete,
}: ColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(status);
  };

  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        className="column-content"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onOpenModal={onOpenModal}
            onOpenModalEdit={onOpenModalEdit}
            onDelete={onDelete}
            onImmediateDelete={onImmediateDelete}
          />
        ))}
        {tasks.length === 0 && <div className="column-placeholder">Drop tasks here</div>}
      </div>
    </div>
  );
}
