import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignee: '',
    dueDate: '',
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

  // Optimistic status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Store previous state for rollback
    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      )
    );

    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      // Rollback on error
      setTasks(previousTasks);
      console.error('Failed to update task:', error);
    }
  };

  // Optimistic delete
  const handleDelete = async (taskId: string) => {
    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      const res = await fetch(`${API_URL}/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      // Rollback on error
      setTasks(previousTasks);
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

  // Optimistic create
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date();

    // Optimistic update with temp task
    const optimisticTask: Task = {
      id: tempId,
      title: newTask.title,
      description: newTask.description || undefined,
      status: 'todo',
      priority: newTask.priority,
      assignee: newTask.assignee || undefined,
      dueDate: newTask.dueDate || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((prev) => [...prev, optimisticTask]);
    setNewTask({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
    setShowForm(false);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      const createdTask = await res.json();

      // Replace temp task with real task
      setTasks((prev) =>
        prev.map((task) =>
          task.id === tempId
            ? { ...createdTask, createdAt: new Date(createdTask.createdAt), updatedAt: new Date(createdTask.updatedAt) }
            : task
        )
      );
    } catch (error) {
      // Remove temp task on error
      setTasks((prev) => prev.filter((task) => task.id !== tempId));
      console.error('Failed to create task:', error);
    }
  };

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="board">
      <div className="board-header">
        <button className="add-task-btn" onClick={() => setShowForm(true)}>
          + New Task
        </button>
      </div>

      <div className="board-columns">
        {columns.map((column) => (
          <Column
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={tasks.filter((t) => t.status === column.status)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDragOver={dragOverStatus === column.status && sourceStatus !== column.status}
            isDragging={!!draggedTaskId}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-status" style={{ backgroundColor: '#3b82f6' }}>New Task</div>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="modal-section">
                  <span className="modal-label">Title</span>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-section">
                  <span className="modal-label">Description</span>
                  <textarea
                    className="modal-textarea"
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="modal-grid">
                  <div className="modal-section">
                    <span className="modal-label">Priority</span>
                    <select
                      className="modal-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="modal-section">
                    <span className="modal-label">Assignee</span>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Assignee"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-section">
                  <span className="modal-label">Due Date</span>
                  <input
                    type="date"
                    className="modal-input"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="modal-create-btn">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
