import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const upload = multer({ dest: 'uploads/' });

// Mock data
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'active', lastActivity: '2024-05-01' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'Analyst', status: 'inactive', lastActivity: '2024-04-15' }
];

let documents = [
  { id: 1, fileName: 'invoice1.pdf', page: 1, type: 'Invoice', dg: false, confidence: 0.95 },
  { id: 2, fileName: 'msds.pdf', page: 1, type: 'Safety Sheet', dg: true, confidence: 0.86 }
];

let reviewQueue = [
  { id: 1, file: 'msds.pdf', page: 1, reason: 'Keyword match', indicator: 'UN 1234', severity: 'high', confidence: 0.88 }
];

let analytics = {
  totalFiles: 2,
  avgPages: 1,
  avgDocuments: 2,
  percentDG: 50
};

let kafkaConfig = { brokers: 'localhost:9092', topic: 'documents', username: '', password: '' };
let kafkaStatus = { connected: true, messages: 0, lag: 0, errors: 0 };

// Routes
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = { id: Date.now(), ...req.body };
  users.push(user);
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).end();
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).end();
  const removed = users.splice(idx, 1)[0];
  res.json(removed);
});

app.get('/api/documents', (req, res) => {
  res.json(documents);
});

app.get('/api/ingestion/config', (req, res) => {
  res.json(kafkaConfig);
});

app.post('/api/ingestion/config', (req, res) => {
  kafkaConfig = { ...kafkaConfig, ...req.body };
  res.json(kafkaConfig);
});

app.get('/api/ingestion/status', (req, res) => {
  res.json(kafkaStatus);
});

app.post('/api/ingest', upload.single('file'), (req, res) => {
  if (req.file) {
    const doc = {
      id: Date.now(),
      fileName: req.file.originalname,
      page: 1,
      type: 'Uploaded',
      dg: false,
      confidence: 0
    };
    documents.push(doc);
    kafkaStatus.messages += 1;
  }
  res.json({ status: 'received' });
});

app.get('/api/review', (req, res) => {
  res.json(reviewQueue);
});

app.post('/api/review/:id/action', (req, res) => {
  res.json({ status: 'recorded', action: req.body.action });
});

app.get('/api/analytics', (req, res) => {
  res.json(analytics);
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
