const logEvent = require('./_log-event');
const logFailure = require('./_log-failure');
const reportPuzzle = require('./_report-puzzle');
const puzzleAverages = require('./_puzzle-averages');

module.exports = async function handler(req, res) {
  if (req.url.includes('/api/log-event')) return logEvent(req, res);
  if (req.url.includes('/api/log-failure')) return logFailure(req, res);
  if (req.url.includes('/api/report-puzzle')) return reportPuzzle(req, res);
  if (req.url.includes('/api/puzzle-averages')) return puzzleAverages(req, res);
  
  return res.status(404).json({ success: false, error: 'Route not found in telemetry router' });
};
