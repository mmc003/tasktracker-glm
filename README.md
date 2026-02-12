# Task Tracker

A simple task management application with a kanban-style board and list view.

## Features

- **Dashboard** - Kanban board with drag-and-drop between columns (To Do, In Progress, In Review, Done)
- **Tasks** - Sortable list view of all tasks
- **Filtering** - Filter tasks by status, priority, assignee, and search
- **Quick Actions**
  - Click a task to view details
  - Right-click for context menu (Edit, Delete)
  - Shift+click on Dashboard for instant delete

## Commands

```bash
npm start      # Start both the API server and dev server
npm stop       # Stop all running processes
npm run dev    # Start only the Vite dev server
npm run server # Start only the API server
npm run build  # Build for production
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express
- **Database**: JSON file (db.json)
