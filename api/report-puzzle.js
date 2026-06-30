/**
 * api/report-puzzle.js
 * POST /api/report-puzzle
 * 
 * Logs a parent's puzzle report into `puzzle_reports`.
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

    const { username, parentCode, puzzleId, reason } = req.body;

    // Verify parent code first
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('parent_code')
      .eq('username', username)
      .single();

    if (userErr || !user) {
      logRequest(req, { status: 404, ms: Date.now() - t0 });
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.parent_code !== parentCode) {
      logRequest(req, { status: 403, ms: Date.now() - t0 });
      return res.status(403).json({ success: false, error: 'Incorrect parent code' });
    }

    const { error } = await supabase
      .from('puzzle_reports')
      .insert([{ username, puzzle_id: puzzleId, reason }]);

    if (error) {
      logError(req, error);
      return res.status(500).json({ success: false, error: 'Failed to save report' });
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ success: true });
  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
