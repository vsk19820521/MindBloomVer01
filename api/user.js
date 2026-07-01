const login = require('./_login');
const register = require('./_register');
const getUser = require('./_get-user');
const saveUser = require('./_save-user');
const deleteUser = require('./_delete-user');
const listUsers = require('./_list-users');

module.exports = async function handler(req, res) {
  if (req.url.includes('/api/login')) return login(req, res);
  if (req.url.includes('/api/register')) return register(req, res);
  if (req.url.includes('/api/get-user')) return getUser(req, res);
  if (req.url.includes('/api/save-user')) return saveUser(req, res);
  if (req.url.includes('/api/delete-user')) return deleteUser(req, res);
  if (req.url.includes('/api/list-users')) return listUsers(req, res);
  
  return res.status(404).json({ success: false, error: 'Route not found in user router' });
};
