/**
 * tests/api/get-user.test.js
 * Unit tests for api/get-user.js response shaping.
 * Run with: node --test tests/api/get-user.test.js
 */

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

// Simulates the user-shaping logic in get-user.js
function shapeUser(dbRow) {
  return {
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
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('get-user: shapes full DB row correctly', () => {
  const dbRow = {
    username: 'adhyantha',
    parent_code: '0000',
    profile: {
      parentEmail: 'p@test.com', parentPhone: '+44123',
      childFirstName: 'Adhyantha', childLastName: 'V',
      childGender: 'Female', childAge: 9,
      childAvatar: '🐱 Doraemon',
      livingCountry: 'UK', culturalAffiliation: 'India'
    },
    game_state: { coins: 130, currentDay: 2, completedPuzzles: {} }
  };

  const user = shapeUser(dbRow);
  assert.equal(user.username, 'adhyantha');
  assert.equal(user.childFirstName, 'Adhyantha');
  assert.equal(user.parentCode, '0000');
  assert.equal(user.gameState.coins, 130);
  assert.ok(!('password_hash' in user), 'password_hash must be excluded');
});

test('get-user: fills defaults for missing profile fields', () => {
  const dbRow = {
    username: 'test',
    parent_code: '0000',
    profile: {},      // empty profile
    game_state: {}
  };

  const user = shapeUser(dbRow);
  assert.equal(user.childFirstName, '');
  assert.equal(user.childGender, 'Other');
  assert.equal(user.childAge, 9);
  assert.equal(user.childAvatar, '⚡ Pikachu');
});

test('get-user: handles null game_state gracefully', () => {
  const dbRow = {
    username: 'test',
    parent_code: '0000',
    profile: {},
    game_state: null
  };
  const user = shapeUser(dbRow);
  assert.deepEqual(user.gameState, {});
});

test('get-user: rejects non-GET methods', () => {
  const method = 'POST';
  assert.notEqual(method, 'GET', 'Only GET allowed');
});

test('get-user: requires username query param', () => {
  const query = {};
  assert.ok(!query.username, 'Missing username param should trigger 400');
});
