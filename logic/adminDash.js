/**
 * logic/adminDash.js
 * Admin Dashboard UI controller
 */
import * as storage from './storage.js';
import * as auth from './auth.js';

let usersData = [];
let puzzlesData = [];
let failuresData = [];
let reportsData = [];

export function init() {
  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    storage.StorageService.logoutUser();
    window.location.reload();
  });

  document.getElementById('tab-admin-users').addEventListener('click', () => switchTab('users'));
  document.getElementById('tab-admin-puzzles').addEventListener('click', () => switchTab('puzzles'));
  document.getElementById('tab-admin-analytics').addEventListener('click', () => switchTab('analytics'));
  document.getElementById('tab-admin-notifications').addEventListener('click', () => switchTab('notifications'));

  // Filters
  document.getElementById('admin-search-users').addEventListener('input', renderUsers);
  document.getElementById('admin-filter-band').addEventListener('change', renderUsers);
  
  document.getElementById('admin-filter-puzzle-band').addEventListener('change', renderPuzzles);
  document.getElementById('admin-filter-difficulty').addEventListener('change', renderPuzzles);
  
  document.getElementById('admin-search-failures').addEventListener('input', renderFailures);
  document.getElementById('btn-admin-refresh-failures').addEventListener('click', loadFailures);
  
  document.getElementById('admin-search-reports').addEventListener('input', renderReports);
  document.getElementById('btn-admin-refresh-reports').addEventListener('click', loadReports);
}

export async function show() {
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('auth-modal-overlay').classList.add('hidden');
  document.getElementById('landing-view').classList.add('hidden');
  document.getElementById('admin-view').style.display = 'block';

  await Promise.all([
    loadUsers(),
    loadPuzzles(),
    loadFailures(),
    loadReports()
  ]);
  
  switchTab('users');
}

function switchTab(tab) {
  document.querySelectorAll('#admin-view .btn-secondary').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
  
  document.getElementById(`tab-admin-${tab}`).classList.add('active');
  document.getElementById(`admin-${tab}-tab`).style.display = 'block';
}

async function loadUsers() {
  try {
    const res = await fetch('/api/admin-users');
    usersData = await res.json();
    renderUsers();
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

async function loadPuzzles() {
  try {
    const res = await fetch('/api/admin-puzzles');
    puzzlesData = await res.json();
    renderPuzzles();
  } catch (err) {
    console.error('Failed to load puzzles:', err);
  }
}

async function loadFailures() {
  try {
    const res = await fetch('/api/admin-failures');
    failuresData = await res.json();
    renderFailures();
  } catch (err) {
    console.error('Failed to load failures:', err);
  }
}

async function loadReports() {
  try {
    const res = await fetch('/api/admin-reports');
    reportsData = await res.json();
    renderReports();
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

function renderUsers() {
  const search = document.getElementById('admin-search-users').value.toLowerCase();
  const band = document.getElementById('admin-filter-band').value;
  
  const filtered = usersData.filter(u => {
    const nameStr = `${u.profile?.childFirstName || ''} ${u.profile?.childLastName || ''} ${u.username}`.toLowerCase();
    if (search && !nameStr.includes(search)) return false;
    if (band && u.puzzle_band !== band) return false;
    return true;
  });

  const tbody = document.querySelector('#admin-users-table tbody');
  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.profile?.childFirstName || ''} ${u.profile?.childLastName || ''}</td>
      <td>${u.puzzle_band || '8-9'}</td>
      <td>Day ${u.game_state?.currentDay || 1} (Lvl ${u.game_state?.level || 1})</td>
      <td>${u.parent_email || '—'}</td>
      <td>${u.parent_phone || '—'}</td>
      <td>${u.profile?.livingCountry || '—'}</td>
      <td>${u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</td>
    </tr>
  `).join('');
}

function renderPuzzles() {
  const band = document.getElementById('admin-filter-puzzle-band').value;
  const diff = document.getElementById('admin-filter-difficulty').value;
  
  const filtered = puzzlesData.filter(p => {
    if (band && p.sourceBand !== band) return false;
    if (diff && p.difficulty !== diff) return false;
    return true;
  });

  const tbody = document.querySelector('#admin-puzzles-table tbody');
  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.sourceBand}</td>
      <td>${p.category}</td>
      <td>${p.theme}</td>
      <td>${p.difficulty || '—'}</td>
      <td>${p.question ? p.question.substring(0, 50) + '...' : '—'}</td>
    </tr>
  `).join('');
}

function renderFailures() {
  const search = document.getElementById('admin-search-failures').value.toLowerCase();
  
  const filtered = failuresData.filter(f => {
    if (search) {
      return f.users.some(u => u.toLowerCase().includes(search));
    }
    return true;
  });

  const tbody = document.querySelector('#admin-failures-table tbody');
  tbody.innerHTML = filtered.map(f => `
    <tr>
      <td>${f.puzzle_id}</td>
      <td>${f.fail_count}</td>
      <td>${f.users.join(', ')}</td>
    </tr>
  `).join('');
}

function renderReports() {
  const search = document.getElementById('admin-search-reports').value.toLowerCase();
  
  const filtered = reportsData.filter(r => {
    if (search) {
      return r.puzzle_id.toLowerCase().includes(search) || r.username.toLowerCase().includes(search);
    }
    return true;
  });

  const tbody = document.querySelector('#admin-reports-table tbody');
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${new Date(r.reported_at).toLocaleDateString()}</td>
      <td>${r.username}</td>
      <td>${r.puzzle_id}</td>
      <td>${r.reason || '-'}</td>
      <td><span class="badge ${r.status === 'open' ? 'badge-warning' : 'badge-success'}">${r.status.toUpperCase()}</span></td>
    </tr>
  `).join('');
}
