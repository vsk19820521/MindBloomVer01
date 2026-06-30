/**
 * api/admin-reports.js
 * GET /api/admin-reports
 * 
 * Returns all puzzle reports submitted by parents.
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
      .from('puzzle_reports')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) {
      logRequest(req, { status: 500, ms: Date.now() - t0, supabaseError: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch reports.' });
    }

    logRequest(req, { status: 200, ms: Date.now() - t0, count: data.length });
    return res.status(200).json(data || []);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
