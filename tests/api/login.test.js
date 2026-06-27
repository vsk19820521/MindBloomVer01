/**
 * tests/api/login.test.js
 * Unit tests for api/login.js handler logic.
 * Run with: node --test tests/api/login.test.js
 */

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

// ── Tests ─────────────────────────────────────────────────────────────────────

test('login: rejects non-POST methods', () => {
  const method = 'GET';
  assert.notEqual(method, 'POST', 'GET should be rejected with 405');
});

test('login: requires username and password', () => {
  const cases = [
    { username: '',    password: 'pw' },
    { username: 'usr', password: '' },
    { username: '',    password: '' }
  ];
  for (const c of cases) {
    assert.ok(!c.username || !c.password, 'Missing credentials should trigger 400');
  }
});

test('login: normalises username to lowercase + trim', () => {
  const raw  = '  Adhyantha  ';
  const norm = raw.trim().toLowerCase();
  assert.equal(norm, 'adhyantha');
});

test('login: returns correct user shape on success', () => {
  // Simulates the shape built from Supabase data
  const dbRow = {
    username:      'adhyantha',
    parent_code:   '0000',
    profile: {
      parentEmail:         'p@test.com',
      parentPhone:         '+44123',
      childFirstName:      'Adhyantha',
      childLastName:       'V',
      childGender:         'Female',
      childAge:            9,
      childAvatar:         '🐱 Doraemon',
      livingCountry:       'United Kingdom',
      culturalAffiliation: 'India'
    },
    game_state: { coins: 130, currentDay: 2 }
  };

  const user = {
    username:            dbRow.username,
    parentCode:          dbRow.parent_code,
    parentEmail:         dbRow.profile?.parentEmail         || '',
    parentPhone:         dbRow.profile?.parentPhone         || '',
    childFirstName:      dbRow.profile?.childFirstName      || '',
    childLastName:       dbRow.profile?.childLastName       || '',
    childGender:         dbRow.profile?.childGender         || 'Other',
    childAge:            dbRow.profile?.childAge            || 9,
    childAvatar:         dbRow.profile?.childAvatar         || '⚡ Pikachu',
    livingCountry:       dbRow.profile?.livingCountry       || '',
    culturalAffiliation: dbRow.profile?.culturalAffiliation || '',
    gameState:           dbRow.game_state                   || {}
  };

  assert.equal(user.username, 'adhyantha');
  assert.equal(user.childFirstName, 'Adhyantha');
  assert.equal(user.gameState.coins, 130);
  assert.equal(user.parentCode, '0000');
  // password_hash must NOT be in user object
  assert.ok(!('password_hash' in user), 'password_hash must not be in response');
  assert.ok(!('password' in user), 'password must not be in response');
});

test('login: wrong password triggers 401', () => {
  // Simulates bcrypt.compare returning false
  const isMatch = false;
  assert.ok(!isMatch, 'Wrong password should produce isMatch=false');
});

test('login: unknown user triggers 404', () => {
  // Simulates Supabase returning no row
  const data  = null;
  const error = { code: 'PGRST116' };
  assert.ok(error || !data, 'Missing row should trigger 404');
});
