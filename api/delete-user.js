/**
 * api/delete-user.js — Delete a Test User
 * POST /api/delete-user
 * Body: { username: string }
 *
 * Safety guard: only allows deletion of usernames that start with "__test_".
 * Used exclusively by the test.html harness to clean up after each test run.
 */

const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username } = req.body || {};

  if (!username) {
    return res.status(400).json({ success: false, error: 'username is required.' });
  }

  const normUsername = username.trim().toLowerCase();

  // Strict safety guard — only test accounts can be deleted via API
  if (!normUsername.startsWith('__test_')) {
    return res.status(403).json({
      success: false,
      error: 'Only accounts with usernames starting with "__test_" can be deleted via this endpoint.'
    });
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('username', normUsername);

  if (error) {
    console.error('Supabase delete-user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete user.' });
  }

  return res.status(200).json({ success: true, message: `User "${normUsername}" deleted.` });
};
