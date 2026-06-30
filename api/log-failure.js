/**
 * api/log-failure.js
 * POST /api/log-failure
 * 
 * Silently logs a puzzle failure into `puzzle_failures`.
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

    const { username, puzzleId } = req.body;
    if (!username || !puzzleId) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const { error } = await supabase
      .from('puzzle_failures')
      .insert([{ username, puzzle_id: puzzleId }]);

    if (error) {
      logError(req, error);
    }

    // Always return success so the client doesn't get interrupted
    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ success: true });
  } catch (err) {
    logError(req, err);
    return res.status(200).json({ success: true }); // Fail silently
  }
};
