const adminUsers = require('./_admin-users');
const adminPuzzles = require('./_admin-puzzles');
const adminFailures = require('./_admin-failures');
const adminReports = require('./_admin-reports');
const adminResolveReports = require('./_admin-resolve-reports');

module.exports = async function handler(req, res) {
  if (req.url.includes('/api/admin-users')) return adminUsers(req, res);
  if (req.url.includes('/api/admin-puzzles')) return adminPuzzles(req, res);
  if (req.url.includes('/api/admin-failures')) return adminFailures(req, res);
  if (req.url.includes('/api/admin-reports')) return adminReports(req, res);
  if (req.url.includes('/api/admin-resolve-reports')) return adminResolveReports(req, res);
  
  return res.status(404).json({ success: false, error: 'Route not found in admin router' });
};
