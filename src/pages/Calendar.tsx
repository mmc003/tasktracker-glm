import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types/Task';
import { TaskModal } from '../components/TaskModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Calendar.css';

const API_URL = 'http://localhost:3001/api/tasks';

const priorityColors: Record<Task['priority'], string> = {
  'low': '#22c55e',
  'medium': '#f59e0b',
  'high': '#ef4444',
};

const statusIcons: Record<Task['status'], string> = {
  'todo': '○',
  'in-progress': '◐',
  'in-review': '◑',
  'done': '●',
};

const statusColors: Record<Task['status'], string> = {
  'todo': '#6b7280',
  'in-progress': '#3b82f6',
  'in-review': '#a855f7',
  'done': '#22c55e',
};

// Task item height (approximate, includes gap)
const TASK_HEIGHT = 22;
const MORE_HEIGHT = 18;

// Day cell component that calculates visible tasks
function DayCell({
  date,
  tasks,
  isToday,
  isDragOver,
  view,
  draggedTaskId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onSelectTask,
  onShowMore,
}: {
  date: Date;
  tasks: Task[];
  isToday: boolean;
  isDragOver: boolean;
  view: 'month' | 'week';
  draggedTaskId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onSelectTask: (task: Task) => void;
  onShowMore: (e: React.MouseEvent, date: Date, tasks: Task[]) => void;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(view === 'week' ? 999 : 2);

  useEffect(() => {
    if (view === 'week' || !cellRef.current || !headerRef.current) {
      setMaxVisible(view === 'week' ? 999 : 2);
      return;
    }

    const cellHeight = cellRef.current.clientHeight;
    const headerHeight = headerRef.current.clientHeight;
    const availableHeight = cellHeight - headerHeight - 8; // 8px padding

    // Calculate how many tasks fit (reserve space for "+N more" if needed)
    const maxTasks = Math.floor((availableHeight - MORE_HEIGHT) / TASK_HEIGHT);
    setMaxVisible(Math.max(1, maxTasks));
  }, [view, tasks.length]);

  const visibleTasks = tasks.slice(0, maxVisible);
  const hiddenCount = tasks.length - maxVisible;

  return (
    <div
      ref={cellRef}
      className={`calendar-day ${isToday ? 'today' : ''} ${isDragOver ? 'drag-over' : ''} ${view === 'week' ? 'week-view' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {view === 'month' && (
        <div ref={headerRef} className="calendar-day-header">
          <span className="calendar-day-number">{date.getDate()}</span>
        </div>
      )}
      <div className="calendar-day-content">
        <div className="calendar-day-tasks">
          {visibleTasks.map(task => (
            <div
              key={task.id}
              className={`calendar-task status-${task.status} ${draggedTaskId === task.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onDragEnd={onDragEnd}
              onClick={() => onSelectTask(task)}
            >
              <span
                className="calendar-task-status"
                style={{ color: statusColors[task.status] }}
                title={task.status.replace('-', ' ')}
              >
                {statusIcons[task.status]}
              </span>
              <span className="calendar-task-title">{task.title}</span>
              <span
                className="calendar-task-priority"
                style={{ backgroundColor: priorityColors[task.priority] }}
                title={task.priority}
              />
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <div
            className="calendar-more-tasks"
            onClick={(e) => onShowMore(e, date, tasks)}
          >
            +{hiddenCount} more
          </div>
        )}
      </div>
    </div>
  );
}

type CalendarView = 'month' | 'week';

export function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<{ date: Date; tasks: Task[]; x: number; y: number } | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');

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

  const handleDeleteRequest = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setSelectedTask(null);
      setTaskToDelete(null);
      try {
        await fetch(`${API_URL}/${taskToDelete.id}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  // Calendar navigation
  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToPrevWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrev = () => {
    if (view === 'month') goToPrevMonth();
    else goToPrevWeek();
  };

  const goToNext = () => {
    if (view === 'month') goToNextMonth();
    else goToNextWeek();
  };

  // Generate calendar days for month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Generate calendar days for week view
  const getDaysInWeek = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.getFullYear(), date.getMonth(), diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i));
    }
    return days;
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === '' || task.status === statusFilter;
    const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = formatDateKey(date);
    return filteredTasks.filter(task => task.dueDate === dateKey);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  // Handle +N more click
  const handleShowMore = (e: React.MouseEvent, date: Date, tasks: Task[]) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setExpandedDay({
      date,
      tasks,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  // Close expanded day popup
  const handleCloseExpanded = () => {
    setExpandedDay(null);
  };

  // Close popup on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (expandedDay && !(e.target as HTMLElement).closest('.calendar-day-popup')) {
        handleCloseExpanded();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [expandedDay]);

  // Close popup on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedDay) {
        handleCloseExpanded();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedDay]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(formatDateKey(date));
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);

    if (draggedTask) {
      const newDueDate = formatDateKey(targetDate);
      if (draggedTask.dueDate !== newDueDate) {
        await handleUpdateTask(draggedTask.id, { dueDate: newDueDate });
      }
    }

    setDraggedTask(null);
  };

  const days = view === 'month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate);
  const numWeeks = Math.ceil(days.length / 7);
  const today = formatDateKey(new Date());
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Get title based on view
  const getViewTitle = () => {
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const weekDays = getDaysInWeek(currentDate);
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.getMonth() === last.getMonth()) {
        return `${monthNames[first.getMonth()]} ${first.getDate()} - ${last.getDate()}, ${first.getFullYear()}`;
      } else {
        return `${monthNames[first.getMonth()]} ${first.getDate()} - ${monthNames[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
      }
    }
  };

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={goToPrev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="calendar-title">{getViewTitle()}</h2>
          <button className="calendar-nav-btn" onClick={goToNext}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="calendar-actions">
          <div className="calendar-filters">
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
            {(search || statusFilter || priorityFilter) && (
              <button className="filter-clear" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
          <div className="calendar-view-controls">
            <div className="calendar-view-toggle">
              <button
                className={`calendar-view-btn ${view === 'month' ? 'active' : ''}`}
                onClick={() => setView('month')}
              >
                Month
              </button>
              <button
                className={`calendar-view-btn ${view === 'week' ? 'active' : ''}`}
                onClick={() => setView('week')}
              >
                Week
              </button>
            </div>
            <button className="calendar-today-btn" onClick={goToToday}>
              Today
            </button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${view === 'week' ? 'week-view' : ''}`}>
        <div className="calendar-days-header">
          {(view === 'month' ? dayNames : fullDayNames).map((day, index) => (
            <div key={day} className="calendar-day-name">
              {view === 'week' && days[index] && (
                <span className="calendar-day-name-date">
                  {(days[index] as Date).getDate()}
                </span>
              )}
              <span>{view === 'month' ? day : day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        <div
          className={`calendar-days ${view === 'week' ? 'week-view' : ''}`}
          style={{ '--num-weeks': numWeeks } as React.CSSProperties}
        >
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day empty" />;
            }

            const dateKey = formatDateKey(date);
            const isToday = dateKey === today;
            const dayTasks = getTasksForDate(date);
            const isDragOver = dragOverDate === dateKey;

            return (
              <DayCell
                key={dateKey}
                date={date}
                tasks={dayTasks}
                isToday={isToday}
                isDragOver={isDragOver}
                view={view}
                draggedTaskId={draggedTask?.id ?? null}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onSelectTask={setSelectedTask}
                onShowMore={handleShowMore}
              />
            );
          })}
        </div>
      </div>

      {/* Expanded day popup */}
      {expandedDay && (
        <div
          className="calendar-day-popup"
          style={{
            left: Math.min(expandedDay.x, window.innerWidth - 220),
            top: Math.min(expandedDay.y, window.innerHeight - 300),
          }}
        >
          <div className="calendar-day-popup-header">
            <span className="calendar-day-popup-date">
              {expandedDay.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button className="calendar-day-popup-close" onClick={handleCloseExpanded}>
              ×
            </button>
          </div>
          <div className="calendar-day-popup-tasks">
            {expandedDay.tasks.map(task => (
              <div
                key={task.id}
                className={`calendar-task status-${task.status} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => {
                  handleDragStart(e, task);
                  setTimeout(handleCloseExpanded, 0);
                }}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setSelectedTask(task);
                  handleCloseExpanded();
                }}
              >
                <span
                  className="calendar-task-status"
                  style={{ color: statusColors[task.status] }}
                  title={task.status.replace('-', ' ')}
                >
                  {statusIcons[task.status]}
                </span>
                <span className="calendar-task-title">{task.title}</span>
                <span
                  className="calendar-task-priority"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                  title={task.priority}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
}
