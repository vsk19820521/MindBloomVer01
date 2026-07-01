/**
 * api/save-user.js — Persist Game State & Profile Updates
 * POST /api/save-user
 * Body: { username, userData: { gameState?, childAvatar?, theme?, ... } }
 *       (or flat: { username, gameState, childAvatar, ... })
 *
 * Called by storage.js _saveUserToServer() in the background after every
 * local localStorage write. Only updates the columns that are present in
 * the payload — profile and game_state are merged, not replaced wholesale.
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

const PROFILE_FIELDS = [
  'childFirstName', 'childLastName', 'childGender', 'childAge',
  'childAvatar', 'livingCountry', 'culturalAffiliation',
  'parentEmail', 'parentPhone'
];

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  try {
  if (req.method !== 'POST') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const username = body.username;

  if (!username) {
    return res.status(400).json({ success: false, error: 'username is required.' });
  }

  const normUsername = username.trim().toLowerCase();
  // Support both { username, userData } and flat { username, gameState, childAvatar... }
  const userData = body.userData || body;

  // ── 1. Fetch the current row so we can deep-merge ────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('profile, game_state, parent_code')
    .eq('username', normUsername)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // ── 2. Build the update payload ──────────────────────────────────────
  const updates = { updated_at: new Date().toISOString() };

  // Merge game_state if provided
  if (userData.gameState) {
    updates.game_state = {
      ...(existing.game_state || {}),
      ...userData.gameState
    };
  }

  // Merge profile fields if any are present
  const incomingProfile = {};
  PROFILE_FIELDS.forEach(field => {
    if (userData[field] !== undefined) incomingProfile[field] = userData[field];
  });
  if (Object.keys(incomingProfile).length > 0) {
    updates.profile = { ...(existing.profile || {}), ...incomingProfile };
  }

  // Update parent_code if provided
  if (userData.parentCode !== undefined) {
    updates.parent_code = String(userData.parentCode);
  }

  // Update puzzle_band if provided
  if (userData.puzzleBand !== undefined) {
    updates.puzzle_band = String(userData.puzzleBand);
  }

  // ── 3. Persist ───────────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('username', normUsername);

  if (updateError) {
    logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: updateError.message });
    return res.status(500).json({ success: false, error: 'Failed to save user data.' });
  }

  logRequest(req, { status: 200, ms: Date.now() - t0 });
  return res.status(200).json({ success: true });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
