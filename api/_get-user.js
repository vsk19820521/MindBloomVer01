/**
 * api/get-user.js — Fetch User Profile (no password returned)
 * GET /api/get-user?username=X
 *
 * Returns the merged profile + game_state for the given username.
 * Password hash is intentionally excluded from the response.
 * Used by storage.js as a lightweight "is this user registered?" check
 * and to refresh the local cache after background sync.
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  try {
    if (req.method !== 'GET') {
      logRequest(req, { status: 405, ms: Date.now() - t0 });
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { username } = req.query;

    if (!username) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'Username query parameter is required.' });
    }

    const normUsername = username.trim().toLowerCase();

    const { data, error } = await supabase
      .from('users')
      .select('username, parent_code, profile, game_state')
      .eq('username', normUsername)
      .single();

    if (error || !data) {
      logRequest(req, { status: 404, ms: Date.now() - t0 });
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Flatten into the shape that storage.js / getCurrentUser() expects
    const user = {
      username:            data.username,
      parentCode:          data.parent_code,
      parentEmail:         data.profile?.parentEmail         || '',
      parentPhone:         data.profile?.parentPhone         || '',
      childFirstName:      data.profile?.childFirstName      || '',
      childLastName:       data.profile?.childLastName       || '',
      childGender:         data.profile?.childGender         || 'Other',
      childAge:            data.profile?.childAge            || 9,
      childAvatar:         data.profile?.childAvatar         || '⚡ Pikachu',
      livingCountry:       data.profile?.livingCountry       || '',
      culturalAffiliation: data.profile?.culturalAffiliation || '',
      gameState:           data.game_state                   || {}
      // NOTE: password is deliberately omitted
    };

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json(user);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
