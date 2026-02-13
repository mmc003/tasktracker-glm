import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, '../db.json');

app.use(cors());
app.use(express.json());

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  tasks: Task[];
}

function readDB(): DB {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Get all tasks
app.get('/api/tasks', (_req: Request, res: Response) => {
  const db = readDB();
  res.json(db.tasks);
});

// Get single task
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const db = readDB();
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create task
app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, priority, assignee, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const db = readDB();
  const now = new Date().toISOString();

  const newTask: Task = {
    id: Date.now().toString(),
    title,
    description,
    status: 'todo',
    priority: priority || 'medium',
    assignee,
    dueDate,
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, assignee, dueDate } = req.body;

  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.tasks[taskIndex] = {
    ...db.tasks[taskIndex],
    title: title ?? db.tasks[taskIndex].title,
    description: description ?? db.tasks[taskIndex].description,
    status: status ?? db.tasks[taskIndex].status,
    priority: priority ?? db.tasks[taskIndex].priority,
    assignee: assignee ?? db.tasks[taskIndex].assignee,
    dueDate: dueDate !== undefined ? dueDate : db.tasks[taskIndex].dueDate,
    updatedAt: new Date().toISOString(),
  };

  writeDB(db);
  res.json(db.tasks[taskIndex]);
});

// Delete task
app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.tasks.splice(taskIndex, 1);
  writeDB(db);
  res.status(204).send();
});

// Duplicate task
app.post('/api/tasks/:id/duplicate', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Generate duplicate title: "title (n)" where n is the next available number
  const baseTitle = task.title.replace(/\s*\(\d+\)$/, '');
  const duplicatePattern = new RegExp(`^${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)$`);

  const existingNumbers = db.tasks
    .filter(t => t.title === baseTitle || duplicatePattern.test(t.title))
    .map(t => {
      const match = t.title.match(/\((\d+)\)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const newTitle = `${baseTitle} (${nextNumber})`;

  const now = new Date().toISOString();
  const newTask: Task = {
    id: Date.now().toString(),
    title: newTitle,
    description: task.description,
    status: 'todo',
    priority: task.priority,
    assignee: task.assignee,
    dueDate: task.dueDate,
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
