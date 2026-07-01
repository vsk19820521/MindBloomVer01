/**
 * api/register.js — New User Registration
 * POST /api/register
 * Body: { username, password, userData: { parentCode, parentEmail, parentPhone,
 *          childFirstName, childLastName, childGender, childAge, childAvatar,
 *          livingCountry, culturalAffiliation, gameState } }
 *
 * Hashes the password with bcrypt before storing in Supabase.
 * Returns { success: false } if the username is already taken.
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

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

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  if (req.method !== 'POST') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {

  const { username, password, userData } = req.body || {};

  if (!username || !password || !userData) {
    return res.status(400).json({ success: false, error: 'username, password and userData are required.' });
  }

  const normUsername = username.trim().toLowerCase();

  // Check for duplicate username
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', normUsername)
    .maybeSingle();

  if (existing) {
    logRequest(req, { status: 400, ms: Date.now() - t0, reason: 'duplicate_username' });
    return res.status(400).json({
      success: false,
      error: 'Username already exists. Try a different one!'
    });
  }

  // Hash password (10 salt rounds — good balance of security vs. speed on Vercel free tier)
  const passwordHash = await bcrypt.hash(password, 10);

  // Split into profile and game_state columns for efficient partial updates later
  const birth_month = parseInt(userData.birthMonth) || 1;
  const birth_year = parseInt(userData.birthYear) || 2017;
  const computedAge = calcAge(birth_month, birth_year);
  const puzzle_band = ageToBand(computedAge);

  const profile = {
    childFirstName:     userData.childFirstName     || '',
    childLastName:      userData.childLastName      || '',
    childGender:        userData.childGender        || 'Other',
    childAge:           computedAge,
    childAvatar:        userData.childAvatar        || '⚡ Pikachu',
    livingCountry:      userData.livingCountry      || '',
    culturalAffiliation: userData.culturalAffiliation || '',
    parentEmail:        userData.parentEmail        || '',
    parentPhone:        userData.parentPhone        || ''
  };

  const gameState = userData.gameState || {
    currentDay: 1,
    unlockedUpToDay: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    coins: 0,
    level: 1,
    levelName: "Mind's Bloom",
    theme: 'unicorn',
    isMuted: false,
    completedPuzzles: {}
  };

  const { error } = await supabase
    .from('users')
    .insert({
      username:      normUsername,
      password_hash: passwordHash,
      parent_code:   userData.parentCode || '0000',
      parent_email:  profile.parentEmail,
      parent_phone:  profile.parentPhone,
      birth_month:   birth_month,
      birth_year:    birth_year,
      puzzle_band:   puzzle_band,
      profile,
      game_state:    gameState
    });

  if (error) {
    logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
    return res.status(500).json({ success: false, error: 'Failed to save registration. Please try again.' });
  }

  logRequest(req, { status: 200, ms: Date.now() - t0 });
  return res.status(200).json({ success: true });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
