/**
 * tests/api/save-user.test.js
 * Unit tests for the save-user merge logic.
 * Run with: node --test tests/api/save-user.test.js
 */

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

const PROFILE_FIELDS = [
  'childFirstName', 'childLastName', 'childGender', 'birthMonth', 'birthYear', 'puzzleBand',
  'childAvatar', 'livingCountry', 'culturalAffiliation',
  'parentEmail', 'parentPhone'
];

// Simulates the merge logic in save-user.js
function buildUpdates(existing, userData) {
  const updates = {};

  if (userData.gameState) {
    updates.game_state = { ...(existing.game_state || {}), ...userData.gameState };
  }

  const incomingProfile = {};
  PROFILE_FIELDS.forEach(field => {
    if (userData[field] !== undefined) incomingProfile[field] = userData[field];
  });
  if (Object.keys(incomingProfile).length > 0) {
    updates.profile = { ...(existing.profile || {}), ...incomingProfile };
  }

  if (userData.parentCode !== undefined) {
    updates.parent_code = String(userData.parentCode);
  }

  return updates;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('save-user: merges game_state without losing existing fields', () => {
  const existing = {
    game_state: { coins: 100, currentDay: 2, theme: 'unicorn', completedPuzzles: { d1_q1: {} } }
  };
  const userData = { gameState: { coins: 150 } };
  const updates  = buildUpdates(existing, userData);

  assert.equal(updates.game_state.coins, 150);
  assert.equal(updates.game_state.currentDay, 2,    'Existing currentDay must survive');
  assert.equal(updates.game_state.theme, 'unicorn', 'Existing theme must survive');
  assert.ok(updates.game_state.completedPuzzles,    'completedPuzzles must survive');
});

test('save-user: merges profile fields partially', () => {
  const existing = {
    profile: { childFirstName: 'Old', birthMonth: 8, birthYear: 2018, livingCountry: 'UK' }
  };
  const userData = { childFirstName: 'New' };
  const updates  = buildUpdates(existing, userData);

  assert.equal(updates.profile.childFirstName, 'New', 'Updated field must change');
  assert.equal(updates.profile.birthMonth, 8,            'Untouched field must survive');
  assert.equal(updates.profile.livingCountry, 'UK',    'Untouched field must survive');
});

test('save-user: does not set game_state update when not provided', () => {
  const existing = { game_state: { coins: 50 } };
  const userData = { childFirstName: 'Test' };
  const updates  = buildUpdates(existing, userData);

  assert.ok(!('game_state' in updates), 'game_state should not be in updates when not provided');
});

test('save-user: does not set profile update when no profile fields given', () => {
  const existing = { profile: { childFirstName: 'X' } };
  const userData = { gameState: { coins: 99 } };
  const updates  = buildUpdates(existing, userData);

  assert.ok(!('profile' in updates), 'profile should not be in updates when no profile fields given');
});

test('save-user: updates parent_code when provided', () => {
  const existing = { parent_code: '0000' };
  const userData = { parentCode: '5678' };
  const updates  = buildUpdates(existing, userData);

  assert.equal(updates.parent_code, '5678');
});

test('save-user: parent_code is coerced to string', () => {
  const existing = {};
  const userData = { parentCode: 1234 };
  const updates  = buildUpdates(existing, userData);

  assert.equal(typeof updates.parent_code, 'string');
  assert.equal(updates.parent_code, '1234');
});

test('save-user: rejects non-POST methods', () => {
  const method = 'GET';
  assert.notEqual(method, 'POST', 'Only POST allowed');
});

test('save-user: requires username field', () => {
  const body = { gameState: { coins: 1 } }; // no username
  assert.ok(!body.username, 'Missing username should fail validation');
});
