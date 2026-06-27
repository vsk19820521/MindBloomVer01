/**
 * tests/integration/flow.test.js
 * Integration tests: register → login → save → get round-trip against real Supabase.
 *
 * PREREQUISITES:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment or .env.local
 *   2. The public.users table must exist in Supabase (run schema.sql)
 *   3. Test users are prefixed "__test_" and cleaned up after each run
 *
 * Run with:
 *   node --test tests/integration/flow.test.js
 *   (or: npm run test:integration)
 *
 * NOTE: These tests hit the real Supabase project. They are intentionally
 * isolated to "__test_" usernames and always clean up after themselves.
 */

'use strict';

const { test, before, after } = require('node:test');
const assert  = require('node:assert/strict');
const http    = require('node:http');

// Load .env.local if present (for local dev runs)
try {
  const fs   = require('node:fs');
  const path = require('node:path');
  const envPath = path.resolve(__dirname, '../../.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && v.length && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    });
  }
} catch { /* ignore */ }

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USERNAME = `__test_flow_${Date.now()}`;
const TEST_PASSWORD = 'IntegrationTest!99';

// ── Helper: POST JSON ─────────────────────────────────────────────────────────

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data   = JSON.stringify(body);
    const url    = new URL(path, BASE_URL);
    const opts   = {
      hostname: url.hostname,
      port:     url.port || 3000,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url  = new URL(path, BASE_URL);
    const opts = { hostname: url.hostname, port: url.port || 3000, path: url.pathname + url.search, method: 'GET' };
    const req  = http.request(opts, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Cleanup helper ────────────────────────────────────────────────────────────

async function deleteTestUser(username) {
  try {
    await post('/api/delete-user', { username });
  } catch { /* ignore cleanup errors */ }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

before(async () => {
  // Ensure clean state
  await deleteTestUser(TEST_USERNAME);
});

after(async () => {
  // Always clean up
  await deleteTestUser(TEST_USERNAME);
});

test('integration: register a new test user', async () => {
  const res = await post('/api/register', {
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    userData: {
      parentCode:          '1234',
      parentEmail:         'integration@test.com',
      parentPhone:         '+441234567890',
      childFirstName:      'IntTest',
      childLastName:       'Child',
      childGender:         'Other',
      childAge:            9,
      childAvatar:         '⚡ Pikachu',
      livingCountry:       'United Kingdom',
      culturalAffiliation: 'India'
    }
  });

  assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  assert.ok(res.body.success, 'success should be true');
});

test('integration: duplicate registration is rejected', async () => {
  const res = await post('/api/register', {
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    userData: { parentCode: '0000', childFirstName: 'Dup', childLastName: 'User', childGender: 'Other', childAge: 9 }
  });
  assert.equal(res.status, 400, 'Duplicate username should return 400');
  assert.ok(!res.body.success);
});

test('integration: login with correct password succeeds', async () => {
  const res = await post('/api/login', { username: TEST_USERNAME, password: TEST_PASSWORD });
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  assert.ok(res.body.success);
  assert.ok(res.body.user, 'user object must be present');
  assert.equal(res.body.user.username, TEST_USERNAME);
  assert.ok(!res.body.user.password_hash, 'password_hash must not be returned');
});

test('integration: login with wrong password fails', async () => {
  const res = await post('/api/login', { username: TEST_USERNAME, password: 'wrong!' });
  assert.equal(res.status, 401);
  assert.ok(!res.body.success);
});

test('integration: login unknown user returns 404', async () => {
  const res = await post('/api/login', { username: '__test_nobody_xyz', password: 'pw' });
  assert.equal(res.status, 404);
});

test('integration: save-user updates game_state coins', async () => {
  const res = await post('/api/save-user', {
    username: TEST_USERNAME,
    gameState: { coins: 999, currentDay: 3 }
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.success);
});

test('integration: get-user returns updated coins', async () => {
  const res = await get(`/api/get-user?username=${TEST_USERNAME}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.gameState?.coins, 999, 'Coins should reflect the save-user update');
  assert.equal(res.body.gameState?.currentDay, 3);
});

test('integration: delete-user removes the test account', async () => {
  const res = await post('/api/delete-user', { username: TEST_USERNAME });
  assert.equal(res.status, 200);
  assert.ok(res.body.success);
});

test('integration: deleted user no longer found', async () => {
  const res = await get(`/api/get-user?username=${TEST_USERNAME}`);
  assert.equal(res.status, 404);
});
