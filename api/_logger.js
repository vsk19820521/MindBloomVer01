/**
 * api/_logger.js — Server-Side Request & Error Logger
 *
 * Thin wrapper used by every Vercel serverless handler.
 * Outputs structured JSON to stdout → captured by Vercel Logs tab.
 * No external dependencies — uses console.log/console.error only.
 *
 * Usage in a handler:
 *   const { logRequest, logError } = require('./_logger');
 *   module.exports = async function handler(req, res) {
 *     const t0 = Date.now();
 *     try {
 *       // ... your logic ...
 *       logRequest(req, { status: 200, ms: Date.now() - t0 });
 *       return res.status(200).json({ success: true });
 *     } catch (err) {
 *       logError(req, err);
 *       return res.status(500).json({ success: false, error: 'Internal server error.' });
 *     }
 *   };
 */

'use strict';

/**
 * Logs a completed request as a single structured JSON line.
 * @param {import('http').IncomingMessage} req
 * @param {{ status: number, ms: number, [key: string]: any }} meta
 */
function logRequest(req, meta = {}) {
  const entry = {
    ts:     new Date().toISOString(),
    level:  meta.status >= 500 ? 'ERROR' : meta.status >= 400 ? 'WARN' : 'INFO',
    method: req.method,
    path:   req.url,
    status: meta.status,
    ms:     meta.ms,
    user:   _extractUser(req),
    ...(_omit(meta, ['status', 'ms']))
  };
  console.log(JSON.stringify(entry));
}

/**
 * Logs an unhandled error with stack trace.
 * @param {import('http').IncomingMessage} req
 * @param {Error} err
 */
function logError(req, err) {
  const entry = {
    ts:     new Date().toISOString(),
    level:  'ERROR',
    method: req.method,
    path:   req.url,
    user:   _extractUser(req),
    error:  err.message,
    stack:  err.stack
  };
  console.error(JSON.stringify(entry));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function _extractUser(req) {
  try {
    return req.body?.username || req.query?.username || '—';
  } catch {
    return '—';
  }
}

function _omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(k => delete result[k]);
  return result;
}

module.exports = { logRequest, logError };
