import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleAdmin } from '../worker/admin.mjs';
import { seedItems } from '../worker/knowledge-seed.mjs';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  const DB = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        first() { return sqlite.prepare(sql).get(...args) || null; },
        all() { return { results: sqlite.prepare(sql).all(...args) }; },
        run() { return { meta: { changes: sqlite.prepare(sql).run(...args).changes } }; },
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const results = statements.map(s => s.run()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const env = { DB, ADMIN_PASSWORD: 'test-only-password', ADMIN_SESSION_SECRET: 'test-only-secret-with-at-least-32-characters' };
  const request = (path, method = 'GET', data, cookie, headers = {}) => new Request(`https://example.test/api/admin/${path}`, {
    method,
    headers: { origin: 'https://example.test', 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers },
    ...(data === undefined ? {} : { body: typeof data === 'string' ? data : JSON.stringify(data) }),
  });
  const call = (path, method, data, cookie, headers) => handleAdmin(request(path, method, data, cookie, headers), env);
  const login = async () => {
    const response = await call('login', 'POST', { password: env.ADMIN_PASSWORD });
    assert.equal(response.status, 200);
    const header = response.headers.get('set-cookie');
    assert.match(header, /HttpOnly; Secure; SameSite=Strict/);
    return header.split(';')[0];
  };
  return { sqlite, env, request, call, login };
}

test('unauthenticated reads/writes and forged sessions are rejected without items', async () => {
  const { call, sqlite } = setup();
  for (const [path, method, data, cookie] of [
    ['knowledge', 'GET'], ['knowledge/' + seedItems[0].id, 'PUT', {}],
    ['knowledge', 'GET', undefined, '__Host-houei_admin=' + 'a'.repeat(64) + '.9999999999.' + 'b'.repeat(64)],
  ]) {
    const response = await call(path, method, data, cookie);
    assert.equal(response.status, 401);
    assert.deepEqual(Object.keys(await response.json()), ['error']);
  }
  sqlite.close();
});

test('missing configuration fails closed and wrong password is rejected', async () => {
  const { env, request, call, sqlite } = setup();
  for (const missing of ['DB', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET']) {
    const response = await handleAdmin(request('login', 'POST', { password: env.ADMIN_PASSWORD }), { ...env, [missing]: undefined });
    assert.equal(response.status, 503);
  }
  assert.equal((await call('login', 'POST', { password: 'wrong' })).status, 401);
  sqlite.close();
});

test('persistent login attempt window throttles even valid credentials', async () => {
  const { call, env, sqlite } = setup();
  for (let i = 0; i < 10; i++) assert.equal((await call('login', 'POST', { password: 'wrong' })).status, 401);
  const response = await call('login', 'POST', { password: env.ADMIN_PASSWORD });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  sqlite.close();
});

test('authenticated merge, optimistic updates and validation use real SQLite SQL', async () => {
  const { call, login, sqlite } = setup();
  const cookie = await login();
  const listing = await (await call('knowledge', 'GET', undefined, cookie)).json();
  assert.equal(listing.authenticated, true);
  assert.equal(listing.items.length, seedItems.length);
  const original = listing.items[0];
  const updated = { ...original, fact: 'Updated fact' };
  const path = 'knowledge/' + original.id;
  const response = await call(path, 'PUT', updated, cookie);
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal((await response.json()).item.version, 2);
  assert.equal((await call(path, 'PUT', updated, cookie)).status, 409);
  const merged = await (await call('knowledge', 'GET', undefined, cookie)).json();
  assert.equal(merged.items[0].fact, 'Updated fact');
  const { version, ...fields } = updated;
  assert.equal((await call(path, 'PUT', { ...fields, expectedVersion: 2 }, cookie)).status, 200);
  for (const changes of [{ status: 'public' }, { sourceUrl: 'javascript:alert(1)' }, { checkedAt: '2026-02-30' }, { title: 'x'.repeat(161) }, { version: 0 }, { notes: null }, { id: 'other' }, { extra: true }]) {
    assert.equal((await call(path, 'PUT', { ...updated, version: 2, ...changes }, cookie)).status, 400);
  }
  assert.equal((await call('knowledge/unknown', 'PUT', updated, cookie)).status, 404);
  sqlite.close();
});

test('CSRF, JSON content type, invalid JSON and streamed body limit', async () => {
  const { call, login, request, env, sqlite } = setup();
  const cookie = await login();
  const item = { ...seedItems[0], version: 1 };
  const path = 'knowledge/' + item.id;
  for (const origin of ['', 'https://evil.test']) assert.equal((await call(path, 'PUT', item, cookie, { origin })).status, 403);
  assert.equal((await call(path, 'PUT', item, cookie, { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await call(path, 'PUT', '{', cookie)).status, 400);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(20000)); controller.enqueue(new Uint8Array(20000)); controller.close(); } });
  const streamed = new Request(request(path, 'PUT', undefined, cookie), { body: stream, duplex: 'half' });
  assert.equal((await handleAdmin(streamed, env)).status, 413);
  sqlite.close();
});

test('expired and revoked sessions cannot access knowledge', async () => {
  const { call, login, sqlite } = setup();
  const cookie = await login();
  const originalNow = Date.now;
  Date.now = () => originalNow() + 9 * 60 * 60 * 1000;
  try { assert.equal((await call('knowledge', 'GET', undefined, cookie)).status, 401); }
  finally { Date.now = originalNow; }
  const logout = await call('logout', 'POST', {}, cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await call('knowledge', 'GET', undefined, cookie)).status, 401);
  sqlite.close();
});

test('non-admin routes are delegated', async () => {
  assert.equal(await handleAdmin(new Request('https://example.test/api/chat'), {}), null);
});
