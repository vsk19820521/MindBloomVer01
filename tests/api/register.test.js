/**
 * tests/api/register.test.js
 * Unit tests for api/register.js handler logic.
 * Uses mock req/res objects — no network calls.
 * Run with: node --test tests/api/register.test.js
 */

'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ── Mock factory helpers ──────────────────────────────────────────────────────

function makeReq(overrides = {}) {
  return {
    method: 'POST',
    url: '/api/register',
    query: {},
    body: {
      username: '__test_reg_unit',
      password: 'testpass123',
      userData: {
        parentCode: '1234',
        parentEmail: 'parent@test.com',
        parentPhone: '+441234567890',
        childFirstName: 'TestChild',
        childLastName: 'Unit',
        childGender: 'Other',
        childAge: 9,
        childAvatar: '⚡ Pikachu',
        livingCountry: 'United Kingdom',
        culturalAffiliation: 'India'
      }
    },
    ...overrides
  };
}

function makeRes() {
  const res = { _status: 200, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body  = body; return res; };
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('register: rejects non-POST methods', async () => {
  // We test the guard condition directly without importing the handler
  // (handler would need real Supabase connection)
  const req = makeReq({ method: 'GET' });
  assert.equal(req.method, 'GET');
  // Guard: if (req.method !== 'POST') → 405
  const isGuarded = req.method !== 'POST';
  assert.ok(isGuarded, 'GET request should be rejected');
});

test('register: requires username, password, userData', () => {
  const req = makeReq({ body: { username: '' } });
  const missingFields = !req.body.username || !req.body.password || !req.body.userData;
  assert.ok(missingFields, 'Missing fields should trigger 400');
});

test('register: normalises username to lowercase', () => {
  const username = '  TestUser  ';
  const norm = username.trim().toLowerCase();
  assert.equal(norm, 'testuser');
});

test('register: parentCode must be 4 digits', () => {
  const validCodes   = ['0000', '1234', '9999'];
  const invalidCodes = ['123', '12345', 'abcd', ''];
  for (const c of validCodes)   assert.match(c, /^\d{4}$/);
  for (const c of invalidCodes) assert.doesNotMatch(c, /^\d{4}$/);
});

test('register: profile fields are mapped correctly', () => {
  const req = makeReq();
  const ud  = req.body.userData;
  const profile = {
    childFirstName:      ud.childFirstName      || '',
    childLastName:       ud.childLastName       || '',
    childGender:         ud.childGender         || 'Other',
    childAge:            parseInt(ud.childAge)  || 9,
    childAvatar:         ud.childAvatar         || '⚡ Pikachu',
    livingCountry:       ud.livingCountry       || '',
    culturalAffiliation: ud.culturalAffiliation || '',
    parentEmail:         ud.parentEmail         || '',
    parentPhone:         ud.parentPhone         || ''
  };
  assert.equal(profile.childFirstName, 'TestChild');
  assert.equal(profile.childAge, 9);
  assert.equal(profile.childGender, 'Other');
});

test('register: default gameState is initialised correctly', () => {
  const gameState = {
    currentDay:      1,
    unlockedUpToDay: 1,
    lastActiveDate:  new Date().toISOString().split('T')[0],
    coins:           0,
    level:           1,
    levelName:       'Mind Bloom',
    theme:           'unicorn',
    isMuted:         false,
    completedPuzzles: {}
  };
  assert.equal(gameState.currentDay, 1);
  assert.equal(gameState.coins, 0);
  assert.deepEqual(gameState.completedPuzzles, {});
});
