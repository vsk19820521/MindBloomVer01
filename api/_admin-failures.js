/**
 * api/admin-failures.js
 * GET /api/admin-failures
 * 
 * Returns puzzle failure analytics.
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

    let query = supabase.from('puzzle_failures').select('*');
    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query;

    if (error) {
      logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch failures.' });
    }

    // Aggregate failures by puzzle_id
    const aggregated = {};
    (data || []).forEach(f => {
      if (!aggregated[f.puzzle_id]) {
        aggregated[f.puzzle_id] = {
          puzzle_id: f.puzzle_id,
          fail_count: 0,
          users: new Set()
        };
      }
      aggregated[f.puzzle_id].fail_count++;
      aggregated[f.puzzle_id].users.add(f.username);
    });

    // Convert Sets to Arrays and sort by fail count
    const result = Object.values(aggregated).map(a => ({
      ...a,
      users: Array.from(a.users)
    })).sort((a, b) => b.fail_count - a.fail_count);

    logRequest(req, { status: 200, ms: Date.now() - t0, count: result.length });
    return res.status(200).json(result);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
