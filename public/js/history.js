requireAuth();

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  API.logout();
  window.location.href = '/index.html';
});

async function load() {
  const params = new URLSearchParams(window.location.search);
  const locFilter = params.get('loc');

  try {
    const data = await API.get('/locations');
    const locs = data.locations;
    const box = document.getElementById('history-list');

    if (!locs.length) {
      box.innerHTML = '<p class="muted">No locations yet. Add one from the Setup page.</p>';
      return;
    }

    // Build combined event feed across locations (or a single one if filtered).
    const rows = [];
    for (const loc of locs) {
      if (locFilter && String(loc.id) !== locFilter) continue;
      const hist = await API.get(`/locations/${loc.id}/history?limit=200`);
      for (const ev of hist.events) {
        rows.push({ ...ev, location: loc.name, locId: loc.id });
      }
    }
    rows.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    if (!rows.length) {
      box.innerHTML = '<p class="muted">No power events recorded yet. Use the simulator to trigger one.</p>';
      return;
    }

    box.innerHTML = `
      <table>
        <thead><tr><th>Time</th><th>Location</th><th>Status</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (ev) => `<tr>
                <td>${fmtTime(ev.recordedAt)}</td>
                <td>📍 ${esc(ev.location)}</td>
                <td><span class="badge ${String(ev.status).toLowerCase()}">${ev.status === 'ON' ? 'POWER ON' : 'POWER OFF'}</span></td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>`;
  } catch (e) {
    if (e.status === 401) window.location.href = '/login.html';
  }
}

load();
