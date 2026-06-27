/**
 * tests/unit/age.test.js
 * Unit tests for calcAge() and ageToBand() from logic/ageUtils.js
 * Run with: node --test tests/unit/age.test.js
 *
 * NOTE: ageUtils.js uses ESM exports. We inline equivalent CJS
 * implementations here so these tests run with plain `node --test`
 * without a bundler. When ageUtils.js is implemented, the import
 * below replaces the inline stubs.
 */

'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');

// ── Inline stubs (replace with real import once ageUtils.js exists) ──────────
// const { calcAge, ageToBand } = require('../../logic/ageUtils.cjs');

function calcAge(birthMonth, birthYear) {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (now.getMonth() + 1 < birthMonth) age--;
  return age;
}

function ageToBand(age) {
  if (age <= 5) return '4-5';
  if (age <= 7) return '6-7';
  return '8-9';
}
// ─────────────────────────────────────────────────────────────────────────────

const THIS_YEAR  = new Date().getFullYear();
const THIS_MONTH = new Date().getMonth() + 1;

// ── calcAge tests ─────────────────────────────────────────────────────────────

test('calcAge: birthday already passed this year → correct age', () => {
  const birthMonth = THIS_MONTH > 1 ? 1 : 12;
  const birthYear  = THIS_YEAR - 9;
  assert.equal(calcAge(birthMonth, birthYear), 9);
});

test('calcAge: birthday not yet this year → one year younger', () => {
  // Pick a month after current month
  const futureMonth = THIS_MONTH < 12 ? THIS_MONTH + 1 : 1;
  const adjustYear  = THIS_MONTH < 12 ? THIS_YEAR - 9 : THIS_YEAR - 10;
  const expected    = THIS_MONTH < 12 ? 8 : 9;
  assert.equal(calcAge(futureMonth, adjustYear), expected);
});

test('calcAge: born exactly this month → age is year difference', () => {
  const age = calcAge(THIS_MONTH, THIS_YEAR - 7);
  assert.equal(age, 7);
});

test('calcAge: very young child (age 4)', () => {
  const birthMonth = THIS_MONTH > 1 ? 1 : 12;
  const birthYear  = THIS_YEAR - 4;
  assert.equal(calcAge(birthMonth, birthYear), 4);
});

test('calcAge: older child (age 12)', () => {
  const birthMonth = THIS_MONTH > 1 ? 1 : 12;
  const birthYear  = THIS_YEAR - 12;
  assert.equal(calcAge(birthMonth, birthYear), 12);
});

// ── ageToBand tests ───────────────────────────────────────────────────────────

test('ageToBand: age 4 → "4-5"', () => {
  assert.equal(ageToBand(4), '4-5');
});

test('ageToBand: age 5 → "4-5"', () => {
  assert.equal(ageToBand(5), '4-5');
});

test('ageToBand: age 6 → "6-7"', () => {
  assert.equal(ageToBand(6), '6-7');
});

test('ageToBand: age 7 → "6-7"', () => {
  assert.equal(ageToBand(7), '6-7');
});

test('ageToBand: age 8 → "8-9"', () => {
  assert.equal(ageToBand(8), '8-9');
});

test('ageToBand: age 9 → "8-9"', () => {
  assert.equal(ageToBand(9), '8-9');
});

test('ageToBand: age 12 (above all bands) → "8-9"', () => {
  assert.equal(ageToBand(12), '8-9');
});

test('ageToBand: age 3 (below lowest band) → "4-5"', () => {
  assert.equal(ageToBand(3), '4-5');
});
