import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { Column } from './Column';
import './Board.css';

const API_URL = 'http://localhost:3001/api/tasks';

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'in-review', title: 'In Review' },
  { status: 'done', title: 'Done' },
];

export function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data.map((t: Task) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedTask = await res.json();
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...updatedTask, createdAt: new Date(updatedTask.createdAt), updatedAt: new Date(updatedTask.updatedAt) }
            : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await fetch(`${API_URL}/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
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
      setSourceStatus(null);
      setDragOverStatus(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      const createdTask = await res.json();
      setTasks((prev) => [...prev, {
        ...createdTask,
        createdAt: new Date(createdTask.createdAt),
        updatedAt: new Date(createdTask.updatedAt),
      }]);
      setNewTask({ title: '', description: '', priority: 'medium', assignee: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (loading) {
    return <div className="board">Loading...</div>;
  }

  return (
    <div className="board">
      <div className="board-header">
        <button className="add-task-btn" onClick={() => setShowForm(!showForm)}>
          + New Task
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
