import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { TaskModal } from '../components/TaskModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Tasks.css';

const API_URL = 'http://localhost:3001/api/tasks';

type SortField = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleDelete = async (taskId: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSelectedTask(null);
    setTaskToDelete(null);

    try {
      const res = await fetch(`${API_URL}/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      setTasks(previousTasks);
      console.error('Failed to delete task:', error);
    }
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
    }
  };

  const handleCancelDelete = () => {
    setTaskToDelete(null);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const previousTasks = tasks;
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  // Get unique assignees for filter dropdown
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = search === '' ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === '' || task.status === statusFilter;
      const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === '' || task.assignee === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    })
    .sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          const statusOrder = { 'todo': 1, 'in-progress': 2, 'in-review': 3, 'done': 4 };
          aVal = statusOrder[a.status];
          bVal = statusOrder[b.status];
          break;
        case 'priority':
          const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'assignee':
          aVal = a.assignee?.toLowerCase() || '';
          bVal = b.assignee?.toLowerCase() || '';
          break;
        case 'dueDate':
          aVal = a.dueDate || '';
          bVal = b.dueDate || '';
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="tasks-content">
          <div className="tasks-empty">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div className="tasks-filters">
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
      </div>

      <div className="tasks-content">
        {filteredTasks.length === 0 ? (
          <div className="tasks-empty">
            <div className="tasks-empty-icon">📋</div>
            <p>No tasks found</p>
          </div>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className={sortField === 'title' ? 'sorted' : ''}>
                  Title {sortField === 'title' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('status')} className={sortField === 'status' ? 'sorted' : ''}>
                  Status {sortField === 'status' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('priority')} className={sortField === 'priority' ? 'sorted' : ''}>
                  Priority {sortField === 'priority' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('assignee')} className={sortField === 'assignee' ? 'sorted' : ''}>
                  Assignee {sortField === 'assignee' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('dueDate')} className={sortField === 'dueDate' ? 'sorted' : ''}>
                  Due Date {sortField === 'dueDate' && <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td
                    className="task-title"
                    onClick={(e) => {
                      if (e.shiftKey) {
                        handleDeleteRequest(task.id);
                      } else {
                        setSelectedTask(task);
                      }
                    }}
                  >
                    {task.title}
                  </td>
                  <td>
                    <span className={`status-badge status-${task.status}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>{task.assignee || '-'}</td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
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
