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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
    return res.status(400).json({
      success: false,
      error: 'Username already exists. Try a different one!'
    });
  }

  // Hash password (10 salt rounds — good balance of security vs. speed on Vercel free tier)
  const passwordHash = await bcrypt.hash(password, 10);

  // Split into profile and game_state columns for efficient partial updates later
  const profile = {
    childFirstName:     userData.childFirstName     || '',
    childLastName:      userData.childLastName      || '',
    childGender:        userData.childGender        || 'Other',
    childAge:           parseInt(userData.childAge) || 9,
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
    levelName: 'Mind Bloom',
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
      profile,
      game_state:    gameState
    });

  if (error) {
    console.error('Supabase registration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save registration. Please try again.' });
  }

  return res.status(200).json({ success: true });
};
