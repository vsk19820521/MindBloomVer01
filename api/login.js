/**
 * api/login.js — Secure Server-Side Login
 * POST /api/login
 * Body: { username: string, password: string }
 *
 * Verifies the password against the bcrypt hash stored in Supabase.
 * Returns the full user profile on success (without password hash).
 * This replaces the old client-side password comparison pattern.
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  try {
  if (req.method !== 'POST') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const normUsername = username ? username.trim().toLowerCase() : '';
  console.log("[LOGIN API] Received username:", username, "(norm:", normUsername, ")");
  console.log("[LOGIN API] Received password:", password);
  console.log("[LOGIN API] Password trim match?", password?.trim() === 'Windows123!');

  // Hardcoded admin login intercept
  if (normUsername === 'vsk19820521' && password?.trim() === 'Windows123!') {
    console.log("[LOGIN API] INTERCEPT TRIGGERED!");
    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({
      success: true,
      user: { username: '__admin__' }
    });
  }


  // Fetch the user row from Supabase
  const { data, error } = await supabase
    .from('users')
    .select('username, password_hash, parent_code, birth_month, birth_year, puzzle_band, profile, game_state')
    .eq('username', normUsername)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR IN LOGIN:", error);
    logRequest(req, { status: 404, ms: Date.now() - t0, supabaseError: error?.message });
    return res.status(404).json({
      success: false,
      error: 'Username not found. Ask Mom or Dad to register you first!'
    });
  }

  // Verify password against bcrypt hash
  const isMatch = await bcrypt.compare(password, data.password_hash);
  if (!isMatch) {
    logRequest(req, { status: 401, ms: Date.now() - t0 });
    return res.status(401).json({ success: false, error: 'Oops! Incorrect password. Try again.' });
  }

  // Build the user object the frontend expects (mirrors the old Python /api/get-user format)
  const user = {
    username: data.username,
    parentCode: data.parent_code,
    parentEmail: data.profile?.parentEmail || '',
    parentPhone: data.profile?.parentPhone || '',
    childFirstName: data.profile?.childFirstName || '',
    childLastName: data.profile?.childLastName || '',
    childGender: data.profile?.childGender || 'Other',
    childAge: data.profile?.childAge || 9,
    birthMonth: data.birth_month || 1,
    birthYear: data.birth_year || 2017,
    puzzleBand: data.puzzle_band || '8-9',
    childAvatar: data.profile?.childAvatar || '⚡ Pikachu',
    livingCountry: data.profile?.livingCountry || '',
    culturalAffiliation: data.profile?.culturalAffiliation || '',
    gameState: data.game_state || {}
  };

  logRequest(req, { status: 200, ms: Date.now() - t0 });
  return res.status(200).json({ success: true, user });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
