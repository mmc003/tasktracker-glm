import { useState } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { Column } from './Column';
import './Board.css';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Set up project structure',
    description: 'Initialize React app with TypeScript',
    status: 'done',
    priority: 'high',
    assignee: 'john',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Create API endpoints',
    description: 'Design and implement REST API for tasks',
    status: 'in-progress',
    priority: 'high',
    assignee: 'jane',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Write unit tests',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Update documentation',
    status: 'todo',
    priority: 'low',
    assignee: 'bob',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: 'Code review PR #42',
    status: 'in-review',
    priority: 'medium',
    assignee: 'alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'in-review', title: 'In Review' },
  { status: 'done', title: 'Done' },
];

export function Board() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<TaskStatus | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignee: '',
  });

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      )
    );
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSourceStatus(task.status);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setSourceStatus(null);
    setDragOverStatus(null);
  };

  const handleDragEnter = (status: TaskStatus) => {
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (newStatus: TaskStatus) => {
    if (draggedTaskId) {
      handleStatusChange(draggedTaskId, newStatus);
      setDraggedTaskId(null);
      setDragOverStatus(null);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      status: 'todo',
      priority: newTask.priority,
      assignee: newTask.assignee || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => [...prev, task]);
    setNewTask({ title: '', description: '', priority: 'medium', assignee: '' });
    setShowForm(false);
  };

  return (
    <div className="board">
      <div className="board-header">
        <button className="add-task-btn" onClick={() => setShowForm(!showForm)}>
          + Add Task
        </button>
      </div>

      {showForm && (
        <form className="task-form" onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <div className="form-row">
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value as TaskPriority })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="text"
              placeholder="Assignee"
              value={newTask.assignee}
              onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="board-columns">
        {columns.map((column) => (
          <Column
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={tasks.filter((t) => t.status === column.status)}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDragOver={dragOverStatus === column.status && sourceStatus !== column.status}
            isDragging={!!draggedTaskId}
          />
        ))}
      </div>
    </div>
  );
}
