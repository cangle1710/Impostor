// Local dev server — mirrors what Vercel API routes do in production.
// Run with: node server-local.js
// Then run: npm run dev (in client/ or via root) in a second terminal.
import 'dotenv/config';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import { URL } from 'url';

// Dynamically load .env.local
try {
  const envLocal = readFileSync('.env.local', 'utf8');
  for (const line of envLocal.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length && !process.env[k.trim()]) {
      process.env[k.trim()] = rest.join('=').trim();
    }
  }
} catch {}

const PORT = 3001;

// Import handlers lazily so env vars are set first
async function getHandler(route) {
  const mod = await import(route + '?t=' + Date.now());
  return mod.default;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

const server = createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const path = u.pathname;

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Wrap native req/res into Vercel-style handler args
  const query = Object.fromEntries(u.searchParams.entries());
  const body = req.method !== 'GET' ? await parseBody(req) : {};

  const fakeReq = { method: req.method, query, body, url: path };
  const fakeRes = {
    statusCode: 200,
    _headers: { 'Content-Type': 'application/json' },
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
    end() { res.writeHead(this.statusCode, this._headers); res.end(); },
    json(data) {
      this._headers['Content-Type'] = 'application/json';
      res.writeHead(this.statusCode, this._headers);
      res.end(JSON.stringify(data));
    },
  };

  // Route matching
  let handlerPath = null;
  const codeMatch = path.match(/^\/api\/lobbies\/([^/]+)\/([^/]+)$/);
  const simpleMatch = path.match(/^\/api\/lobbies\/([^/]+)$/);

  if (path === '/api/lobbies/create') {
    handlerPath = './api/lobbies/create.js';
  } else if (path === '/api/lobbies/join') {
    handlerPath = './api/lobbies/join.js';
  } else if (codeMatch) {
    fakeReq.query.code = codeMatch[1];
    const action = codeMatch[2];
    handlerPath = `./api/lobbies/[code]/${action}.js`;
  } else {
    res.writeHead(404); res.end('Not found'); return;
  }

  try {
    const handler = await getHandler(handlerPath);
    await handler(fakeReq, fakeRes);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
  console.log('Start the frontend separately: npm run dev');
});
