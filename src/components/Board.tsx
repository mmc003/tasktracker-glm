import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
import { ConfirmDialog } from './ConfirmDialog';
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
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignee: '',
    dueDate: '',
  });

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

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

  // ESC key to close new task form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

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

  // Update task
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );

    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      setTasks(previousTasks);
      console.error('Failed to update task:', error);
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

  const handleDeleteRequest = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await handleDelete(taskToDelete.id);
      setTaskToDelete(null);
      setSelectedTask(null);
    }
  };

  const handleCancelDelete = () => {
    setTaskToDelete(null);
  };

  // Get unique assignees for filter dropdown
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === '' || task.status === statusFilter;
    const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === '' || task.assignee === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
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
        <div className="board-filters">
          <input
            type="text"
            className="filter-search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="filter-select"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All Assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {(search || statusFilter || priorityFilter || assigneeFilter) && (
            <button className="filter-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
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
            tasks={filteredTasks.filter((t) => t.status === column.status)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDragOver={dragOverStatus === column.status && sourceStatus !== column.status}
            isDragging={!!draggedTaskId}
            onOpenModal={handleOpenModal}
            onDelete={handleDeleteRequest}
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
          onDelete={handleDeleteRequest}
          onUpdate={handleUpdateTask}
        />
      )}

      {taskToDelete && (
        <ConfirmDialog
          message={`Delete "${taskToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
