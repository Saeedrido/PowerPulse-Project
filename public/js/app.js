const API = {
  base: '',
  token: localStorage.getItem('pp_token') || null,

  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (this.token) opts.headers.Authorization = 'Bearer ' + this.token;
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(this.base + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },

  setToken(token) {
    this.token = token;
    localStorage.setItem('pp_token', token);
  },
  logout() {
    this.token = null;
    localStorage.removeItem('pp_token');
  },
};

function requireAuth() {
  if (!API.token) window.location.href = '/login.html';
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

function statusBadge(status) {
  const cls = String(status).toLowerCase();
  const label =
    status === 'ON' ? 'POWER AVAILABLE' :
    status === 'OFF' ? 'POWER UNAVAILABLE' : 'UNKNOWN';
  const dot = status === 'ON' ? '🟢' : status === 'OFF' ? '🔴' : '⚪';
  return `<span class="status ${cls}"><span class="dot"></span>${dot} ${label}</span>`;
}

document.querySelectorAll('.js-logout').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    API.logout();
    window.location.href = '/index.html';
  });
});

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
