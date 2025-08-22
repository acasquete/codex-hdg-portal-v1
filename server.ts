import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActivity: string;
}

interface FieldInfo {
  value: string;
  confidence: number;
}

interface Document {
  id: number;
  fileName: string;
  page: number;
  type: string;
  dg: boolean;
  confidence: number;
  fields: Record<string, FieldInfo>;
  preview: string;
}

interface ReviewItem {
  id: number;
  file: string;
  page: number;
  reason: string;
  indicator: string;
  severity: string;
  confidence: number;
}

interface Analytics {
  totalFiles: number;
  avgPages: number;
  avgDocuments: number;
  percentDG: number;
}

interface KafkaConfig {
  brokers: string;
  topic: string;
  username: string;
  password: string;
}

interface KafkaStatus {
  connected: boolean;
  messages: number;
  lag: number;
  errors: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const upload = multer({ dest: 'uploads/' });

// Mock data
let users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'active', lastActivity: '2024-05-01' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'Analyst', status: 'inactive', lastActivity: '2024-04-15' }
];

let documents: Document[] = [
  {
    id: 1,
    fileName: 'invoice1.pdf',
    page: 1,
    type: 'Invoice',
    dg: false,
    confidence: 0.95,
    fields: {
      supplier: { value: 'ACME Corp', confidence: 0.93 },
      date: { value: '2024-05-01', confidence: 0.88 },
      items: { value: 'Widgets', confidence: 0.82 },
      total: { value: '$1,000', confidence: 0.91 },
      un: { value: 'UN0000', confidence: 0.1 }
    },
    preview: ''
  },
  {
    id: 2,
    fileName: 'msds.pdf',
    page: 1,
    type: 'Safety Sheet',
    dg: true,
    confidence: 0.86,
    fields: {
      supplier: { value: 'Contoso Chemicals', confidence: 0.9 },
      un: { value: 'UN1234', confidence: 0.95 },
      hazard: { value: 'Flammable', confidence: 0.84 }
    },
    preview: ''
  }
];

let reviewQueue: ReviewItem[] = [
  { id: 1, file: 'msds.pdf', page: 1, reason: 'Keyword match', indicator: 'UN 1234', severity: 'high', confidence: 0.88 }
];

let analytics: Analytics = {
  totalFiles: 2,
  avgPages: 1,
  avgDocuments: 2,
  percentDG: 50
};

let kafkaConfig: KafkaConfig = { brokers: 'localhost:9092', topic: 'documents', username: '', password: '' };
let kafkaStatus: KafkaStatus = { connected: true, messages: 0, lag: 0, errors: 0 };

// Routes
app.get('/api/users', (_req: Request, res: Response<User[]>) => {
  res.json(users);
});

app.post('/api/users', (req: Request<{}, {}, Omit<User, 'id'>>, res: Response<User>) => {
  const user: User = { id: Date.now(), ...req.body };
  users.push(user);
  res.status(201).json(user);
});

app.put('/api/users/:id', (req: Request<{ id: string }, {}, Partial<User>>, res: Response<User>) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).end();
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

app.delete('/api/users/:id', (req: Request<{ id: string }>, res: Response<User>) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).end();
  const removed = users.splice(idx, 1)[0];
  res.json(removed);
});

app.get('/api/documents', (_req: Request, res: Response<Document[]>) => {
  res.json(documents);
});

app.get('/api/ingestion/config', (_req: Request, res: Response<KafkaConfig>) => {
  res.json(kafkaConfig);
});

app.post('/api/ingestion/config', (req: Request<{}, {}, Partial<KafkaConfig>>, res: Response<KafkaConfig>) => {
  kafkaConfig = { ...kafkaConfig, ...req.body };
  res.json(kafkaConfig);
});

app.get('/api/ingestion/status', (_req: Request, res: Response<KafkaStatus>) => {
  res.json(kafkaStatus);
});

app.post('/api/ingest', upload.single('file'), (req: Request, res: Response<{ status: string }>) => {
  if (req.file) {
    const doc: Document = {
      id: Date.now(),
      fileName: req.file.originalname,
      page: 1,
      type: 'Uploaded',
      dg: false,
      confidence: 0,
      fields: {},
      preview: ''
    };
    documents.push(doc);
    kafkaStatus.messages += 1;
  }
  res.json({ status: 'received' });
});

app.get('/api/review', (_req: Request, res: Response<ReviewItem[]>) => {
  res.json(reviewQueue);
});

app.post('/api/review/:id/action', (req: Request, res: Response<{ status: string; action: string }>) => {
  res.json({ status: 'recorded', action: req.body.action });
});

app.get('/api/analytics', (_req: Request, res: Response<Analytics>) => {
  res.json(analytics);
});

// Fallback to index.html
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
