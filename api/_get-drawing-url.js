/**
 * api/get-drawing-url.js
 * GET /api/get-drawing-url?path=...
 * 
 * Generates a 1-hour signed URL for a file in the 'drawings' bucket.
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  if (req.method !== 'GET') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;

    if (!path || !path.startsWith('drawings/')) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }

    const bucketPath = path.substring('drawings/'.length); // remove 'drawings/' prefix

    const { data, error } = await supabase.storage
      .from('drawings')
      .createSignedUrl(bucketPath, 3600); // 1 hour

    if (error) {
      logError({ endpoint: '/api/get-drawing-url', path }, error);
      logRequest(req, { status: 500, ms: Date.now() - t0 });
      return res.status(500).json({ success: false, error: 'Failed to generate signed URL' });
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ success: true, url: data.signedUrl });

  } catch (err) {
    logError({ endpoint: '/api/get-drawing-url' }, err);
    logRequest(req, { status: 500, ms: Date.now() - t0 });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
