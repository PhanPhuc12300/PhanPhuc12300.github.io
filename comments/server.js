// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { nanoid } = require('nanoid');

const DATA_FILE = path.join(__dirname, 'comments.json');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors()); // allow requests from any origin (tùy chỉnh khi deploy)
app.use(express.json());
app.use(morgan('dev'));

// helper: read/write file safely (simple)
function readData() {
  try {
    const s = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(s || '[]');
  } catch (e) {
    return [];
  }
}
function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// Routes
app.get('/comments', (req, res) => {
  const data = readData();
  // return sorted newest first
  data.sort((a,b) => new Date(b.ts) - new Date(a.ts));
  res.json(data);
});

app.post('/comments', (req, res) => {
  const { name = 'Khách', content = '' } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  const data = readData();
  const item = {
    id: nanoid(10),
    name: String(name).slice(0, 100),
    content: String(content).slice(0, 2000),
    ts: new Date().toISOString(),
    likes: 0
  };
  data.push(item);
  writeData(data);
  res.status(201).json(item);
});

app.put('/comments/:id', (req, res) => {
  const id = req.params.id;
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'Content required' });
  const data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx].content = content.slice(0, 2000);
  data[idx].ts = new Date().toISOString();
  writeData(data);
  res.json(data[idx]);
});

app.delete('/comments/:id', (req, res) => {
  const id = req.params.id;
  let data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = data.splice(idx, 1)[0];
  writeData(data);
  res.json({ ok: true, removed });
});

app.post('/comments/:id/like', (req, res) => {
  const id = req.params.id;
  const data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx].likes = (data[idx].likes || 0) + 1;
  writeData(data);
  res.json(data[idx]);
});

// health
app.get('/', (req, res) => res.send('Comment API OK'));

app.listen(PORT, () => {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  console.log(`Server running on http://localhost:${PORT}`);
});
