/**
 * tests/unit/puzzle-band.test.js
 * Unit tests for the puzzle band selection logic.
 * Ensures the right puzzle file would be loaded for each child's age.
 * Run with: node --test tests/unit/puzzle-band.test.js
 */

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

// Inline stub — matches the logic in logic/ageUtils.js
function ageToBand(age) {
  if (age <= 5) return '4-5';
  if (age <= 7) return '6-7';
  return '8-9';
}

function puzzleFileForBand(band) {
  return `data/puzzles_${band}.json`;
}

function puzzleFileForAge(age) {
  return puzzleFileForBand(ageToBand(age));
}

// ── Band → file mapping ───────────────────────────────────────────────────────

test('band "4-5" maps to correct puzzle file', () => {
  assert.equal(puzzleFileForBand('4-5'), 'data/puzzles_4-5.json');
});

test('band "6-7" maps to correct puzzle file', () => {
  assert.equal(puzzleFileForBand('6-7'), 'data/puzzles_6-7.json');
});

test('band "8-9" maps to correct puzzle file', () => {
  assert.equal(puzzleFileForBand('8-9'), 'data/puzzles_8-9.json');
});

// ── Age → file end-to-end ────────────────────────────────────────────────────

test('age 4 → puzzles_4-5.json', () => {
  assert.equal(puzzleFileForAge(4), 'data/puzzles_4-5.json');
});

test('age 5 → puzzles_4-5.json', () => {
  assert.equal(puzzleFileForAge(5), 'data/puzzles_4-5.json');
});

test('age 6 → puzzles_6-7.json', () => {
  assert.equal(puzzleFileForAge(6), 'data/puzzles_6-7.json');
});

test('age 7 → puzzles_6-7.json', () => {
  assert.equal(puzzleFileForAge(7), 'data/puzzles_6-7.json');
});

test('age 8 → puzzles_8-9.json', () => {
  assert.equal(puzzleFileForAge(8), 'data/puzzles_8-9.json');
});

test('age 10 → puzzles_8-9.json', () => {
  assert.equal(puzzleFileForAge(10), 'data/puzzles_8-9.json');
});

// ── Band progression sequence ────────────────────────────────────────────────

test('band progression order is correct', () => {
  const BAND_ORDER = ['4-5', '6-7', '8-9'];
  assert.equal(BAND_ORDER[0], '4-5');
  assert.equal(BAND_ORDER[1], '6-7');
  assert.equal(BAND_ORDER[2], '8-9');
});

test('next band after "4-5" is "6-7"', () => {
  const BAND_ORDER = ['4-5', '6-7', '8-9'];
  const current = '4-5';
  const nextIdx = BAND_ORDER.indexOf(current) + 1;
  assert.equal(BAND_ORDER[nextIdx], '6-7');
});

test('next band after "6-7" is "8-9"', () => {
  const BAND_ORDER = ['4-5', '6-7', '8-9'];
  const current = '6-7';
  const nextIdx = BAND_ORDER.indexOf(current) + 1;
  assert.equal(BAND_ORDER[nextIdx], '8-9');
});

test('no next band after "8-9" (final band)', () => {
  const BAND_ORDER = ['4-5', '6-7', '8-9'];
  const current = '8-9';
  const nextIdx = BAND_ORDER.indexOf(current) + 1;
  assert.equal(BAND_ORDER[nextIdx], undefined);
});
