import { seedItems } from './knowledge-seed.mjs';

const COOKIE = '__Host-houei_admin';
const TTL = 8 * 60 * 60;
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const equal = (a, b) => {
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
};
const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
};
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
});
const fail = (message, status) => { throw Object.assign(new Error(message), { status }); };
const cookie = (value, age = TTL) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
async function schema(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS admin_attempts (ip_hash TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS knowledge_overrides (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL)'),
  ]);
}
async function bodyJSON(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) fail('JSON required', 415);
  if (Number(request.headers.get('content-length')) > 32768) fail('Body too large', 413);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); fail('Body too large', 413); }
      chunks.push(value);
    }
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  let result;
  try { result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)); } catch { fail('Invalid JSON', 400); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail('Object required', 400);
  return result;
}
async function session(request, env) {
  const value = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value || !/^[a-f0-9]{64}\.[0-9]{10,13}\.[a-f0-9]{64}$/.test(value)) return null;
  const [token, expires, signature] = value.split('.');
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return null;
  if (!equal(signature, await sign(`${token}.${expires}`, env.ADMIN_SESSION_SECRET))) return null;
  const hash = await digest(token);
  const row = await env.DB.prepare('SELECT expires FROM admin_sessions WHERE token_hash = ?').bind(hash).first();
  return row && Number(row.expires) === Number(expires) ? hash : null;
}
const limits = { title: 160, category: 80, fact: 4000, answer: 6000, sourceUrl: 2048, checkedAt: 10, notes: 4000 };
function validate(input, id) {
  const allowed = new Set(['id', 'status', 'version', 'expectedVersion', ...Object.keys(limits)]);
  if (Object.keys(input).some(key => !allowed.has(key))) fail('Unknown field', 400);
  if (input.id !== undefined && input.id !== id) fail('Invalid id', 400);
  for (const [key, max] of Object.entries(limits)) {
    if (typeof input[key] !== 'string' || input[key].length > max) fail(`Invalid ${key}`, 400);
  }
  if (!input.title.trim() || !input.category.trim()) fail('Title and category required', 400);
  if (!['draft', 'review', 'approved'].includes(input.status)) fail('Invalid status', 400);
  const version = input.expectedVersion ?? input.version;
  if (input.expectedVersion !== undefined && input.version !== undefined && input.expectedVersion !== input.version) fail('Conflicting version fields', 400);
  if (!Number.isSafeInteger(version) || version < 1 || version >= Number.MAX_SAFE_INTEGER) fail('Invalid version', 400);
  if (input.sourceUrl) {
    let url;
    try { url = new URL(input.sourceUrl); } catch { fail('Invalid sourceUrl', 400); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('Invalid sourceUrl', 400);
  }
  if (input.checkedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkedAt) || !Number.isFinite(Date.parse(input.checkedAt)) || new Date(input.checkedAt).toISOString().slice(0, 10) !== input.checkedAt)) fail('Invalid checkedAt', 400);
  const { expectedVersion, ...fields } = input;
  return { ...fields, id, version: version + 1 };
}

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/admin/')) return null;
  try {
    if (!env?.DB || typeof env.ADMIN_PASSWORD !== 'string' || !env.ADMIN_PASSWORD || typeof env.ADMIN_SESSION_SECRET !== 'string' || env.ADMIN_SESSION_SECRET.length < 32) return json({ error: 'Admin unavailable' }, 503);
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('origin') !== url.origin) return json({ error: 'Invalid origin' }, 403);
    await schema(env.DB);
    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      const input = await bodyJSON(request);
      const now = Math.floor(Date.now() / 1000);
      const windowStart = Math.floor(now / 900) * 900;
      const ip = await digest(request.headers.get('cf-connecting-ip') || 'unknown');
      const attempt = await env.DB.prepare('INSERT INTO admin_attempts (ip_hash, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET attempts = CASE WHEN window_start = excluded.window_start THEN attempts + 1 ELSE 1 END, window_start = excluded.window_start RETURNING attempts').bind(ip, windowStart).first();
      if (!attempt || attempt.attempts > 10) return json({ error: 'Too many attempts' }, 429, { 'Retry-After': String(windowStart + 900 - now) });
      if (typeof input.password !== 'string' || input.password.length > 1024 || !equal(await digest(input.password), await digest(env.ADMIN_PASSWORD))) return json({ error: 'Invalid credentials' }, 401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const expires = now + TTL;
      await env.DB.prepare('DELETE FROM admin_sessions WHERE expires <= ?').bind(now).run();
      await env.DB.prepare('INSERT INTO admin_sessions (token_hash, expires) VALUES (?, ?)').bind(await digest(token), expires).run();
      const value = `${token}.${expires}`;
      return json({ authenticated: true }, 200, { 'Set-Cookie': cookie(`${value}.${await sign(value, env.ADMIN_SESSION_SECRET)}`) });
    }
    const tokenHash = await session(request, env);
    if (!tokenHash) return json({ error: 'Authentication required' }, 401);
    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      await bodyJSON(request);
      await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
      return json({ authenticated: false }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    if (url.pathname === '/api/admin/knowledge' && request.method === 'GET') {
      const rows = await env.DB.prepare('SELECT id, data, version FROM knowledge_overrides').all();
      const overrides = new Map(rows.results.map(row => [row.id, { ...JSON.parse(row.data), version: row.version }]));
      return json({ authenticated: true, items: seedItems.map(item => overrides.get(item.id) || { ...item, version: 1 }) });
    }
    const match = url.pathname.match(/^\/api\/admin\/knowledge\/([A-Za-z0-9_-]+)$/);
    if (match && request.method === 'PUT') {
      const id = match[1];
      const seed = seedItems.find(item => item.id === id);
      if (!seed) return json({ error: 'Unknown item' }, 404);
      const input = await bodyJSON(request);
      const item = validate(input, id);
      const results = await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO knowledge_overrides (id, data, version) VALUES (?, ?, 1)').bind(id, JSON.stringify({ ...seed, version: 1 })),
        env.DB.prepare('UPDATE knowledge_overrides SET data = ?, version = version + 1 WHERE id = ? AND version = ?').bind(JSON.stringify(item), id, item.version - 1),
      ]);
      if (results[1].meta.changes !== 1) return json({ error: 'Version conflict; reload before saving' }, 409);
      return json({ authenticated: true, item });
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    return json({ error: error.status ? error.message : 'Admin request failed' }, error.status || 500);
  }
}
