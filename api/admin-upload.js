// api/admin-upload.js
// Simple admin upload endpoint. Protect using ADMIN_SECRET env var (set in Vercel).
// Request: POST JSON { title, description, image, game_link, code, key_required (bool) }
// Header: x-admin-secret: <your secret>

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.resolve(__dirname, '..', 'scripts.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '[]');
  } catch (e) { return []; }
}

function writeDB(arr) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2), 'utf8');
    return true;
  } catch (e) { console.error(e); return false; }
}

module.exports = async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ error: 'Server not configured (ADMIN_SECRET).' });

  const provided = req.headers['x-admin-secret'] || req.headers['admin-secret'];
  if (!provided || provided !== adminSecret) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  const body = req.body;
  if (!body || !body.title || !body.code) return res.status(400).json({ error: 'Missing title or code' });

  const db = readDB();
  const item = {
    id: uuidv4(),
    title: String(body.title),
    description: String(body.description || ''),
    image: body.image || null,
    game_link: body.game_link || null,
    code: String(body.code),
    key_required: !!body.key_required,
    created_at: new Date().toISOString()
  };
  db.push(item);
  const ok = writeDB(db);
  if (!ok) return res.status(500).json({ error: 'Failed to save' });
  return res.status(201).json({ ok: true, item });
};
