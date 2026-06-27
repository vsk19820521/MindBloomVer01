/**
 * api/puzzle-averages.js — Global Per-Puzzle Solve Time Averages
 * GET /api/puzzle-averages
 *
 * Scans all users' game_state.completedPuzzles and computes the average
 * correct-attempt time for each puzzle ID.
 * Returns: { "d1_q1": 18, "d1_q2": 25, ... }  (seconds, rounded)
 *
 * NOTE: With the move to static thresholds (Easy=20s, Medium=30s, Hard=40s),
 * this endpoint is less critical but kept for analytics and future use.
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
      .select('game_state')
      .not('username', 'eq', '__admin__');

    if (error) {
      logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
      return res.status(500).json({});
    }

    const buckets = {}; // { puzzleId: [seconds, ...] }

    (data || []).forEach(row => {
      const completedPuzzles = row.game_state?.completedPuzzles || {};
      Object.entries(completedPuzzles).forEach(([pid, record]) => {
        if (!record?.answered || record?.correct !== true) return;

        const attempts = record.attempts || [];
        let secondsSpent = null;

        // Use the first attempt marked as correct
        for (const att of attempts) {
          if (att.correct === true) {
            secondsSpent = att.secondsSpent;
            break;
          }
        }

        if (secondsSpent == null) secondsSpent = 10; // fallback default

        if (!buckets[pid]) buckets[pid] = [];
        buckets[pid].push(secondsSpent);
      });
    });

    const result = {};
    Object.entries(buckets).forEach(([pid, times]) => {
      if (times.length > 0) {
        result[pid] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    });

    logRequest(req, { status: 200, ms: Date.now() - t0, puzzleCount: Object.keys(result).length });
    return res.status(200).json(result);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({});
  }
};
