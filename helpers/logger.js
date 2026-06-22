/**
 * logger.js - System Diagnostic & Log Capture Utility
 * Captures all console operations and uncaught errors in a ring buffer.
 * Provides diagnostics download for manual reporting.
 */

const MAX_LOGS = 200;
const logBuffer = [];

// Keep copies of original console functions
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function formatTime() {
  return new Date().toISOString();
}

function pushLog(type, args) {
  const message = args.map(arg => {
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(" ");
  
  const entry = `[${formatTime()}] [${type}] ${message}`;
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }
}

// Override console methods
console.log = function(...args) {
  originalLog.apply(console, args);
  pushLog("INFO", args);
};

console.warn = function(...args) {
  originalWarn.apply(console, args);
  pushLog("WARN", args);
};

console.error = function(...args) {
  originalError.apply(console, args);
  pushLog("ERROR", args);
};

// Global error handlers
window.addEventListener("error", (event) => {
  pushLog("UNCAUGHT_ERROR", [event.message, `at ${event.filename}:${event.lineno}:${event.colno}`]);
});

window.addEventListener("unhandledrejection", (event) => {
  pushLog("UNHANDLED_REJECTION", [event.reason]);
});

export const Logger = {
  getLogs() {
    return logBuffer;
  },

  exportDiagnostics(currentUser = null) {
    const diagnostics = {
      timestamp: formatTime(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorageDump: {},
      currentUserSession: currentUser,
      consoleLogs: logBuffer
    };

    // Dump all localStorage entries related to mindbloom
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mindbloom_")) {
          diagnostics.localStorageDump[key] = localStorage.getItem(key);
        }
      }
    } catch (e) {
      diagnostics.localStorageError = e.message;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diagnostics, null, 2));
    const downloadAnchor = document.createElement("a");
    
    const formattedDate = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const username = currentUser ? currentUser.username : "anonymous";
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindbloom_diagnostics_${username}_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
