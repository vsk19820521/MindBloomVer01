/**
 * helpers/logger.js — Client-Side Diagnostic & Log Capture
 *
 * Captures all console operations and uncaught errors in a ring buffer.
 * Each entry is tagged with a per-session ID so Vercel Logs can correlate
 * client errors with server-side request logs.
 *
 * API:
 *   Logger.info(msg, ...args)   — informational
 *   Logger.warn(msg, ...args)   — warnings
 *   Logger.error(msg, ...args)  — errors (also POSTed to /api/log-event)
 *   Logger.getLogs()            — returns the ring buffer array
 *   Logger.exportDiagnostics()  — downloads a JSON diagnostics file
 */

const MAX_LOGS = 200;
const logBuffer = [];

// Stable session ID for this browser tab (regenerated on hard reload)
const SESSION_ID = _generateSessionId();

function _generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatTime() {
  return new Date().toISOString();
}

function pushLog(level, args) {
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
  }).join(' ');

  const entry = {
    ts:        formatTime(),
    level,
    sessionId: SESSION_ID,
    message
  };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  return entry;
}

// Keep copies of original console functions
const _origLog   = console.log;
const _origWarn  = console.warn;
const _origError = console.error;

// Override console methods to capture into ring buffer
console.log = function (...args) {
  _origLog.apply(console, args);
  pushLog('INFO', args);
};
console.warn = function (...args) {
  _origWarn.apply(console, args);
  pushLog('WARN', args);
};
console.error = function (...args) {
  _origError.apply(console, args);
  const entry = pushLog('ERROR', args);
  _relayToServer(entry);
};

// Relay an error entry to the server (fire-and-forget)
function _relayToServer(entry) {
  try {
    fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        level:     entry.level,
        message:   entry.message,
        context:   { url: window.location.href }
      })
    }).catch(() => { /* silently ignore network failures */ });
  } catch {
    // Never let the logger itself crash the app
  }
}

// Global error handlers
window.addEventListener('error', event => {
  const entry = pushLog('UNCAUGHT_ERROR', [
    event.message,
    `at ${event.filename}:${event.lineno}:${event.colno}`
  ]);
  _relayToServer(entry);
});

window.addEventListener('unhandledrejection', event => {
  const entry = pushLog('UNHANDLED_REJECTION', [String(event.reason)]);
  _relayToServer(entry);
});

export const Logger = {
  /** Session ID for correlating client logs with server logs */
  sessionId: SESSION_ID,

  info(...args)  { _origLog.apply(console, args);   pushLog('INFO',  args); },
  warn(...args)  { _origWarn.apply(console, args);  pushLog('WARN',  args); },
  error(...args) { _origError.apply(console, args); const e = pushLog('ERROR', args); _relayToServer(e); },

  /** Returns a copy of the current log buffer */
  getLogs() {
    return [...logBuffer];
  },

  /**
   * Downloads a JSON diagnostics file for manual bug reporting.
   * @param {object|null} currentUser — the active user session object, if any
   */
  exportDiagnostics(currentUser = null) {
    const diagnostics = {
      timestamp:          formatTime(),
      sessionId:          SESSION_ID,
      userAgent:          navigator.userAgent,
      url:                window.location.href,
      currentUserSession: currentUser ? { username: currentUser.username } : null,
      localStorageDump:   {},
      consoleLogs:        logBuffer
    };

    // Dump all mindbloom-related localStorage entries
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mindbloom_')) {
          diagnostics.localStorageDump[key] = localStorage.getItem(key);
        }
      }
    } catch (e) {
      diagnostics.localStorageError = e.message;
    }

    const dataStr = 'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(diagnostics, null, 2));
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const user = currentUser?.username || 'anonymous';
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `mindbloom_diagnostics_${user}_${ts}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
