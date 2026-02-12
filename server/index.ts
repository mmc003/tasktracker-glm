import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

let tasks: Task[] = [
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
];

// Get all tasks
app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(tasks);
});

// Get single task
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create task
app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, priority, assignee } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask: Task = {
    id: Date.now().toString(),
    title,
    description,
    status: 'todo',
    priority: priority || 'medium',
    assignee,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, assignee } = req.body;

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    title: title ?? tasks[taskIndex].title,
    description: description ?? tasks[taskIndex].description,
    status: status ?? tasks[taskIndex].status,
    priority: priority ?? tasks[taskIndex].priority,
    assignee: assignee ?? tasks[taskIndex].assignee,
    updatedAt: new Date(),
  };

  res.json(tasks[taskIndex]);
});

// Delete task
app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
