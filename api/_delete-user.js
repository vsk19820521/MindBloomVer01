/**
 * api/delete-user.js — Delete a Test User
 * POST /api/delete-user
 * Body: { username: string }
 *
 * Safety guard: only allows deletion of usernames that start with "__test_".
 * Used exclusively by the test.html harness and integration tests to clean up
 * after each test run.
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  try {
    if (req.method !== 'POST') {
      logRequest(req, { status: 405, ms: Date.now() - t0 });
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { username } = req.body || {};

    if (!username) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'username is required.' });
    }

    const normUsername = username.trim().toLowerCase();

    // Strict safety guard — only test accounts can be deleted via API
    if (!normUsername.startsWith('__test_')) {
      logRequest(req, { status: 403, ms: Date.now() - t0, reason: 'non_test_username' });
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
      logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
      return res.status(500).json({ success: false, error: 'Failed to delete user.' });
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ success: true, message: `User "${normUsername}" deleted.` });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
