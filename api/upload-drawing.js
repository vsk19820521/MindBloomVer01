/**
 * api/upload-drawing.js
 * POST /api/upload-drawing
 * Body: { username, puzzleId, imageDataUrl }
 * 
 * Uploads a base64 drawing to the Supabase 'drawings' bucket.
 * Returns { success: true, path }
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  if (req.method !== 'POST') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, puzzleId, imageDataUrl } = req.body;

    if (!username || !puzzleId || !imageDataUrl) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Convert data URL to Buffer
    const matches = imageDataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'Invalid image data' });
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const timestamp = Date.now();
    const filePath = `${username}/${puzzleId}_${timestamp}.${extension}`;

    let { data, error } = await supabase.storage
      .from('drawings')
      .upload(filePath, buffer, {
        contentType: `image/${matches[1]}`
      });

    // Auto-create bucket if it doesn't exist
    if (error && error.message.includes('Bucket not found')) {
      const { error: createError } = await supabase.storage.createBucket('drawings', { public: true });
      if (!createError) {
        // Retry upload after creating the bucket
        const retry = await supabase.storage
          .from('drawings')
          .upload(filePath, buffer, {
            contentType: `image/${matches[1]}`
          });
        data = retry.data;
        error = retry.error;
      } else {
        error = createError; // Surface the bucket creation error
      }
    }

    if (error) {
      logError({ endpoint: '/api/upload-drawing', username }, error);
      logRequest(req, { status: 500, ms: Date.now() - t0 });
      return res.status(500).json({ success: false, error: 'Upload failed: ' + error.message });
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ 
      success: true, 
      path: `drawings/${data.path || filePath}`
    });

  } catch (err) {
    logError({ endpoint: '/api/upload-drawing' }, err);
    logRequest(req, { status: 500, ms: Date.now() - t0 });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
