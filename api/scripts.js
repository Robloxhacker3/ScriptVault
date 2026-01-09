// api/scripts.js
// Simple Vercel serverless handler that returns scripts JSON for the bot
// Note: Vercel's filesystem is ephemeral. For persistent storage use Supabase / external DB.

const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '..', 'scripts.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('readDB error', e);
    return [];
  }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const all = readDB();

  // ?search=...
  if (q.search) {
    const search = String(q.search).toLowerCase();
    const filtered = all.filter(s => (s.title||'').toLowerCase().includes(search) || (s.description||'').toLowerCase().includes(search));
    return res.status(200).json(filtered.slice(0, Number(q.limit || 20)));
  }

  // ?recent=true&limit=#
  if (q.recent) {
    const sorted = all.slice().sort((a,b) => (new Date(b.created_at) - new Date(a.created_at)));
    return res.status(200).json(sorted.slice(0, Number(q.limit || 10)));
  }

  // default: return all (capped)
  return res.status(200).json(all.slice(0, 50));
};
