/**
 * api/list-users.js — Summary List of All Registered Children
 * GET /api/list-users
 *
 * Returns a lightweight array of { username, childFirstName, childLastName, coins, level }
 * Used by the Parent Dashboard to display all children associated with this instance.
 */

const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('username, profile, game_state')
    .order('username', { ascending: true });

  if (error) {
    console.error('Supabase list-users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list users.' });
  }

  const users = (data || []).map(row => ({
    username:      row.username,
    childFirstName: row.profile?.childFirstName || '',
    childLastName:  row.profile?.childLastName  || '',
    coins:          row.game_state?.coins       || 0,
    level:          row.game_state?.level       || 1
  }));

  return res.status(200).json(users);
};
