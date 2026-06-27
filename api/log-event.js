/**
 * api/log-event.js — Client-Side Error Relay
 * POST /api/log-event
 * Body: { sessionId, level, message, context }
 *
 * Called by helpers/logger.js on unhandled browser errors.
 * Writes the event to Vercel Logs so client errors are visible
 * server-side alongside API errors. Fire-and-forget from the browser.
 */

'use strict';

const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();

  if (req.method !== 'POST') {
    logRequest(req, { status: 405, ms: Date.now() - t0 });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, level = 'ERROR', message, context = {} } = req.body || {};

    if (!message) {
      logRequest(req, { status: 400, ms: Date.now() - t0 });
      return res.status(400).json({ success: false, error: 'message is required.' });
    }

    // Write the client event to Vercel Logs
    const entry = {
      ts:        new Date().toISOString(),
      level:     `CLIENT_${String(level).toUpperCase()}`,
      sessionId: sessionId || 'unknown',
      message,
      context
    };
    if (level === 'ERROR') {
      console.error(JSON.stringify(entry));
    } else {
      console.warn(JSON.stringify(entry));
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ success: true });

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
