// ============================================================
//  E-Governance Automation System — Shared JS Utilities
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ─── Auth Token Helpers ───────────────────────────────────────
const Auth = {
  setToken:  (t) => localStorage.setItem('egov_token', t),
  getToken:  ()  => localStorage.getItem('egov_token'),
  setUser:   (u) => localStorage.setItem('egov_user', JSON.stringify(u)),
  getUser:   ()  => JSON.parse(localStorage.getItem('egov_user') || 'null'),
  clear:     ()  => { localStorage.removeItem('egov_token'); localStorage.removeItem('egov_user'); },
  isLoggedIn:()  => !!localStorage.getItem('egov_token'),
};

// ─── API Request Helper ───────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  return data;
}

// Multipart (file upload)
async function apiUpload(endpoint, formData) {
  const token = Auth.getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ─── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Utilities ────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function statusBadge(status) {
  const map = {
    submitted: ['badge-orange', 'Submitted'],
    in_review: ['badge-blue',   'In Review'],
    approved:  ['badge-green',  'Approved'],
    rejected:  ['badge-red',    'Rejected'],
    closed:    ['badge-gray',   'Closed'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadge(p) {
  const map = { normal: ['badge-gray','Normal'], high: ['badge-orange','High'], urgent: ['badge-red','Urgent'] };
  const [cls, label] = map[p] || ['badge-gray', p];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Redirect if not logged in
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// Redirect if already logged in
function redirectIfLoggedIn() {
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    window.location.href = user?.role === 'admin' ? 'admin.html' : 'portal.html';
  }
}
