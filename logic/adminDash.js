/**
 * logic/adminDash.js
 * Admin Dashboard UI controller
 */
import * as storage from './storage.js';

let usersData = [];
let puzzlesData = [];
let failuresData = [];
let reportsData = [];

// Sorting state
let sortState = {
  users: { col: 'lastLogin', asc: false },
  puzzles: { col: 'id', asc: true },
  reports: { col: 'date', asc: false }
};

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
  document.getElementById('admin-filter-category').addEventListener('change', renderPuzzles);
  
  document.getElementById('btn-admin-refresh-analytics').addEventListener('click', async () => {
    await Promise.all([loadFailures(), loadUsers(), loadPuzzles()]);
  });
  
  document.getElementById('admin-search-reports').addEventListener('input', renderReports);
  document.getElementById('btn-admin-refresh-reports').addEventListener('click', loadReports);

  // Sorting logic
  document.querySelectorAll('#admin-users-table th.sortable').forEach(th => {
    th.addEventListener('click', () => handleSort('users', th.dataset.sort));
  });
  document.querySelectorAll('#admin-puzzles-table th.sortable').forEach(th => {
    th.addEventListener('click', () => handleSort('puzzles', th.dataset.sort));
  });
  document.querySelectorAll('#admin-reports-table th.sortable').forEach(th => {
    th.addEventListener('click', () => handleSort('reports', th.dataset.sort));
  });

  // Bulk Reports logic
  document.getElementById('admin-reports-select-all').addEventListener('change', (e) => {
    document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = e.target.checked);
  });
  document.getElementById('btn-admin-resolve-reports').addEventListener('click', () => handleBulkReports('resolve'));
  document.getElementById('btn-admin-delete-reports').addEventListener('click', () => handleBulkReports('delete'));
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
  
  if (tab === 'analytics') {
    renderAnalytics();
  }
}

function handleSort(table, col) {
  if (sortState[table].col === col) {
    sortState[table].asc = !sortState[table].asc;
  } else {
    sortState[table].col = col;
    sortState[table].asc = true;
  }
  
  if (table === 'users') renderUsers();
  if (table === 'puzzles') renderPuzzles();
  if (table === 'reports') renderReports();
}

// ── DATA LOADING ──────────────────────────────────────────

async function loadUsers() {
  try {
    const res = await fetch('/api/admin-users');
    if (res.ok) {
      usersData = await res.json();
      renderUsers();
    }
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

async function loadPuzzles() {
  try {
    const res = await fetch('/api/admin-puzzles');
    if (res.ok) {
      puzzlesData = await res.json();
      renderPuzzles();
    }
  } catch (err) {
    console.error('Failed to load puzzles:', err);
  }
}

async function loadFailures() {
  try {
    const res = await fetch('/api/admin-failures');
    if (res.ok) {
      failuresData = await res.json();
      if (document.getElementById('admin-analytics-tab').style.display === 'block') {
        renderAnalytics();
      }
    }
  } catch (err) {
    console.error('Failed to load failures:', err);
  }
}

async function loadReports() {
  try {
    const res = await fetch('/api/admin-reports');
    if (res.ok) {
      reportsData = await res.json();
      renderReports();
    }
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

// ── BULK ACTIONS ──────────────────────────────────────────

async function handleBulkReports(action) {
  const checkboxes = document.querySelectorAll('.report-checkbox:checked');
  if (checkboxes.length === 0) {
    alert("Please select at least one report.");
    return;
  }

  const reportIds = Array.from(checkboxes).map(cb => ({
    username: cb.dataset.username,
    puzzle_id: cb.dataset.puzzleId
  }));

  try {
    const res = await fetch('/api/admin-resolve-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reportIds })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('admin-reports-select-all').checked = false;
      await loadReports();
    } else {
      alert("Failed to update reports: " + data.error);
    }
  } catch (e) {
    console.error("Bulk action failed", e);
  }
}

// ── RENDERING ──────────────────────────────────────────

function sortData(data, getVal, asc) {
  return [...data].sort((a, b) => {
    let va = getVal(a);
    let vb = getVal(b);
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
}

function renderUsers() {
  const search = document.getElementById('admin-search-users').value.toLowerCase();
  const band = document.getElementById('admin-filter-band').value;
  
  let filtered = usersData.filter(u => {
    const nameStr = `${u.profile?.childFirstName || ''} ${u.profile?.childLastName || ''} ${u.username}`.toLowerCase();
    if (search && !nameStr.includes(search)) return false;
    if (band && u.puzzle_band !== band) return false;
    return true;
  });

  // Sort
  filtered = sortData(filtered, u => {
    switch (sortState.users.col) {
      case 'username': return u.username;
      case 'name': return `${u.profile?.childFirstName || ''} ${u.profile?.childLastName || ''}`;
      case 'band': return u.puzzle_band || '8-9';
      case 'progress': return u.game_state?.currentDay || 1;
      case 'email': return u.parent_email || '';
      case 'phone': return u.parent_phone || '';
      case 'country': return u.profile?.livingCountry || '';
      case 'lastLogin': return u.updated_at ? new Date(u.updated_at).getTime() : 0;
      default: return u.username;
    }
  }, sortState.users.asc);

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
  const category = document.getElementById('admin-filter-category').value;
  
  let filtered = puzzlesData.filter(p => {
    if (band && p.sourceBand !== band) return false;
    if (diff && p.difficulty !== diff) return false;
    if (category && p.category !== category) return false;
    return true;
  });

  // Sort
  filtered = sortData(filtered, p => {
    switch (sortState.puzzles.col) {
      case 'id': return p.id;
      case 'band': return p.sourceBand || '';
      case 'category': return p.category || '';
      case 'theme': return p.theme || '';
      case 'difficulty': return p.difficulty || '';
      default: return p.id;
    }
  }, sortState.puzzles.asc);

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

function renderReports() {
  const search = document.getElementById('admin-search-reports').value.toLowerCase();
  
  let filtered = reportsData.filter(r => {
    if (search) {
      return r.puzzle_id.toLowerCase().includes(search) || r.username.toLowerCase().includes(search);
    }
    return true;
  });

  // Sort
  filtered = sortData(filtered, r => {
    switch (sortState.reports.col) {
      case 'date': return new Date(r.reported_at).getTime();
      case 'username': return r.username;
      case 'puzzleId': return r.puzzle_id;
      case 'reason': return r.reason || '';
      case 'status': return r.status;
      default: return new Date(r.reported_at).getTime();
    }
  }, sortState.reports.asc);

  const tbody = document.querySelector('#admin-reports-table tbody');
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><input type="checkbox" class="report-checkbox" data-username="${r.username}" data-puzzle-id="${r.puzzle_id}"></td>
      <td>${new Date(r.reported_at).toLocaleDateString()}</td>
      <td>${r.username}</td>
      <td>${r.puzzle_id}</td>
      <td>${r.reason || '-'}</td>
      <td><span class="badge ${r.status === 'open' ? 'badge-warning' : 'badge-success'}">${r.status.toUpperCase()}</span></td>
    </tr>
  `).join('');
}

function renderAnalytics() {
  if (!puzzlesData.length || !usersData.length) return;

  const cats = [...new Set(puzzlesData.map(p => p.category).filter(Boolean))];
  const diffs = ['Easy', 'Medium', 'Hard'];

  const fmt = (n) => n <= 5 ? `<span style="color: var(--error); font-weight: bold;">${n}</span>` : n;

  // 1. Puzzles by Category x Age Group
  const catHtml = cats.map(cat => {
    const p4 = puzzlesData.filter(p => p.category === cat && p.sourceBand === '4-5').length;
    const p6 = puzzlesData.filter(p => p.category === cat && p.sourceBand === '6-7').length;
    const p8 = puzzlesData.filter(p => p.category === cat && p.sourceBand === '8-9').length;
    return `<tr><td>${cat}</td><td>${fmt(p4)}</td><td>${fmt(p6)}</td><td>${fmt(p8)}</td><td><strong>${fmt(p4+p6+p8)}</strong></td></tr>`;
  }).join('');
  document.querySelector('#analytics-cat-band-table tbody').innerHTML = catHtml;

  // 2. Puzzles by Difficulty x Age Group
  const diffHtml = diffs.map(diff => {
    const p4 = puzzlesData.filter(p => p.difficulty === diff && p.sourceBand === '4-5').length;
    const p6 = puzzlesData.filter(p => p.difficulty === diff && p.sourceBand === '6-7').length;
    const p8 = puzzlesData.filter(p => p.difficulty === diff && p.sourceBand === '8-9').length;
    return `<tr><td>${diff}</td><td>${fmt(p4)}</td><td>${fmt(p6)}</td><td>${fmt(p8)}</td><td><strong>${fmt(p4+p6+p8)}</strong></td></tr>`;
  }).join('');
  document.querySelector('#analytics-diff-band-table tbody').innerHTML = diffHtml;

  // 3. Most Failed Categories
  const pMap = {};
  puzzlesData.forEach(p => { pMap[p.id] = p; });

  const failStats = {};
  cats.forEach(c => failStats[c] = { '4-5': 0, '6-7': 0, '8-9': 0, total: 0 });

  failuresData.forEach(f => {
    const p = pMap[f.puzzle_id];
    if (p && failStats[p.category]) {
      failStats[p.category][p.sourceBand] += f.fail_count;
      failStats[p.category].total += f.fail_count;
    }
  });

  const sortedFailCats = cats.sort((a,b) => failStats[b].total - failStats[a].total);
  const fHtml = sortedFailCats.map(cat => `<tr><td>${cat}</td><td>${failStats[cat]['4-5']}</td><td>${failStats[cat]['6-7']}</td><td>${failStats[cat]['8-9']}</td></tr>`).join('');
  document.querySelector('#analytics-failures-table tbody').innerHTML = fHtml;

  // 4. Users Demographics
  const uBands = { '4-5': 0, '6-7': 0, '8-9': 0 };
  const uLevels = {};
  const uCountries = {};

  usersData.forEach(u => {
    if (u.username === '__admin__') return; // Skip admin
    const b = u.puzzle_band || '8-9';
    if (uBands[b] !== undefined) uBands[b]++;

    const l = u.game_state?.levelName || "Mind's Bloom";
    uLevels[l] = (uLevels[l] || 0) + 1;

    const c = u.profile?.livingCountry || 'Unknown';
    uCountries[c] = (uCountries[c] || 0) + 1;
  });

  document.getElementById('analytics-users-band').innerHTML = Object.entries(uBands)
    .map(([b,c]) => `<li>Band ${b}: <strong style="float: right;">${c}</strong></li>`).join('');

  document.getElementById('analytics-users-level').innerHTML = Object.entries(uLevels)
    .sort((a,b) => b[1] - a[1])
    .map(([l,c]) => `<li>${l}: <strong style="float: right;">${c}</strong></li>`).join('');

  document.getElementById('analytics-users-country').innerHTML = Object.entries(uCountries)
    .sort((a,b) => b[1] - a[1])
    .map(([c,cnt]) => `<li>${c}: <strong style="float: right;">${cnt}</strong></li>`).join('');
}
