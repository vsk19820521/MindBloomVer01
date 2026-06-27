/**
 * api/list-users.js — Summary List of All Registered Children
 * GET /api/list-users
 *
 * Returns a lightweight array of { username, childFirstName, childLastName, coins, level }
 * Used by the Parent Dashboard to display all children associated with this instance.
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

    const { data, error } = await supabase
      .from('users')
      .select('username, profile, game_state')
      .not('username', 'eq', '__admin__')   // exclude admin from child list
      .order('username', { ascending: true });

    if (error) {
      logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
      return res.status(500).json({ success: false, error: 'Failed to list users.' });
    }

    const users = (data || []).map(row => ({
      username:       row.username,
      childFirstName: row.profile?.childFirstName || '',
      childLastName:  row.profile?.childLastName  || '',
      coins:          row.game_state?.coins       || 0,
      level:          row.game_state?.level       || 1
    }));

    logRequest(req, { status: 200, ms: Date.now() - t0, count: users.length });
    return res.status(200).json(users);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
