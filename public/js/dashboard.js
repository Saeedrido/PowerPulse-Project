requireAuth();

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  API.logout();
  window.location.href = '/index.html';
});

async function loadNotifications() {
  try {
    const data = await API.get('/notifications?limit=15');
    const box = document.getElementById('notifications');
    if (!data.notifications.length) {
      box.innerHTML = '<p class="muted">No notifications yet.</p>';
      return;
    }
    box.innerHTML = data.notifications
      .map(
        (n) =>
          `<div class="notif"><div class="icon ${n.type === 'POWER_OFF' ? 'off' : 'on'}">${n.type === 'POWER_OFF' ? ICONS.powerOff : ICONS.powerOn}</div>
           <div><div class="msg">${esc(n.message)}</div>
           <div class="time">${fmtTime(n.createdAt)}</div></div></div>`
      )
      .join('');
  } catch (e) {
    if (e.status === 401) window.location.href = '/login.html';
  }
}

async function loadLocations() {
  try {
    const data = await API.get('/locations');
    const wrap = document.getElementById('locations');
    const empty = document.getElementById('empty-state');

    if (!data.locations.length) {
      empty.style.display = 'block';
      wrap.innerHTML = '';
      return;
    }
    empty.style.display = 'none';

    const cards = [];
    for (const loc of data.locations) {
      const today = await todaysActivity(loc.id);
      cards.push(`
        <div class="card loc-card">
          <div class="loc-head">
            <div class="loc-name"><span class="inline-ic">${ICONS.pin}</span>${esc(loc.name)}</div>
            ${statusBadge(loc.currentStatus)}
          </div>
          <div class="meta">
            <div class="item"><div class="k">Last change</div><div class="v">${fmtTime(loc.lastStatusChangeAt)}</div></div>
            <div class="item"><div class="k">Device last seen</div><div class="v">${fmtRelative(loc.device ? loc.device.lastSeenAt : null)}</div></div>
            <div class="item"><div class="k">Today's activity</div><div class="v">${today.offCount} OFF · ${today.onCount} ON</div></div>
          </div>
          <div class="loc-actions">
            <a class="btn btn-ghost" href="/history.html?loc=${loc.id}">View history</a>
            <a class="btn btn-ghost" href="/setup.html?loc=${loc.id}">Manage</a>
          </div>
        </div>
      `);
    }
    wrap.innerHTML = cards.join('');
  } catch (e) {
    if (e.status === 401) window.location.href = '/login.html';
  }
}

async function todaysActivity(locId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  try {
    const data = await API.get(`/locations/${locId}/history?limit=500`);
    let onCount = 0, offCount = 0;
    for (const ev of data.events) {
      if (new Date(ev.recordedAt) >= todayStart) {
        if (ev.status === 'ON') onCount++;
        else offCount++;
      }
    }
    return { onCount, offCount };
  } catch (e) {
    return { onCount: 0, offCount: 0 };
  }
}

function refresh() {
  loadLocations();
  loadNotifications();
}

refresh();
// Simple polling for near-real-time updates (WebSockets can replace this later).
setInterval(refresh, 5000);
