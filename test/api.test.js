import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';

test('GET /api/users', async () => {
  const res = await request(app).get('/api/users');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('POST /api/users creates user', async () => {
  const user = { name: 'Carol', email: 'carol@example.com', role: 'Viewer' };
  const res = await request(app).post('/api/users').send(user);
  assert.equal(res.status, 201);
  assert.equal(res.body.name, user.name);

  const list = await request(app).get('/api/users');
  assert.ok(list.body.some(u => u.email === user.email));
});

test('DELETE /api/users/:id removes user', async () => {
  const res = await request(app).post('/api/users').send({ name: 'Temp', email: 'temp@example.com', role: 'Viewer' });
  const id = res.body.id;
  const del = await request(app).delete(`/api/users/${id}`);
  assert.equal(del.status, 200);
  const list = await request(app).get('/api/users');
  assert.ok(!list.body.find(u => u.id === id));
});

test('PUT /api/users/:id updates user', async () => {
  const res = await request(app).post('/api/users').send({ name: 'EditMe', email: 'edit@example.com', role: 'Viewer', status: 'active' });
  const id = res.body.id;
  const updated = await request(app).put(`/api/users/${id}`).send({ role: 'Analyst', status: 'inactive' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.role, 'Analyst');
  assert.equal(updated.body.status, 'inactive');
});

test('POST /api/ingestion/config updates config', async () => {
  const cfg = { brokers: 'kafka:9092', topic: 'test' };
  const res = await request(app).post('/api/ingestion/config').send(cfg);
  assert.equal(res.status, 200);
  assert.equal(res.body.brokers, cfg.brokers);
  assert.equal(res.body.topic, cfg.topic);
});

test('GET /api/ingestion/status returns metrics', async () => {
  const res = await request(app).get('/api/ingestion/status');
  assert.equal(res.status, 200);
  assert.ok(typeof res.body.messages === 'number');
  assert.ok('lag' in res.body);
});

test('POST /api/ingest accepts file upload', async () => {
  const res = await request(app)
    .post('/api/ingest')
    .attach('file', Buffer.from('hello'), 'test.txt');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'received');
  const status = await request(app).get('/api/ingestion/status');
  assert.equal(status.body.messages > 0, true);
});
