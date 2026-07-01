/**
 * api/admin-resolve-reports.js
 * POST /api/admin-resolve-reports
 * 
 * Handles bulk actions on puzzle reports (mark as resolved or delete).
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

    const { action, reportIds } = req.body;
    // reportIds could be an array of { username, puzzle_id } or a unique ID if one exists.
    // puzzle_reports has username, puzzle_id, reported_at, reason, status
    // For simplicity, we assume we match by username and puzzle_id

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No reports specified' });
    }

    let successCount = 0;

    for (const report of reportIds) {
      if (action === 'delete') {
        const { error } = await supabase
          .from('puzzle_reports')
          .delete()
          .eq('username', report.username)
          .eq('puzzle_id', report.puzzle_id);
        if (!error) successCount++;
      } else if (action === 'resolve') {
        const { error } = await supabase
          .from('puzzle_reports')
          .update({ status: 'resolved' })
          .eq('username', report.username)
          .eq('puzzle_id', report.puzzle_id);
        if (!error) successCount++;
      }
    }

    logRequest(req, { status: 200, ms: Date.now() - t0, successCount });
    return res.status(200).json({ success: true, count: successCount });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
