requireAuth();

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  API.logout();
  window.location.href = '/index.html';
});

let locations = [];

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

async function loadLocations(selectLocId) {
  const data = await API.get('/locations');
  locations = data.locations;
  const sel = document.getElementById('dev-loc');
  sel.innerHTML =
    '<option value="">Choose a location…</option>' +
    locations
      .map((l) => `<option value="${l.id}">${esc(l.name)}</option>`)
      .join('');
  if (selectLocId) sel.value = selectLocId;
  renderDevices();
}

function renderDevices() {
  const box = document.getElementById('devices-list');
  if (!locations.length) {
    box.innerHTML = '<p class="muted">No devices yet. Create a location and connect a device.</p>';
    return;
  }
  const devices = [];
  for (const l of locations) {
    if (l.device) devices.push({ device: l.device, location: l.name });
  }
  if (!devices.length) {
    box.innerHTML = '<p class="muted">No devices connected yet.</p>';
    return;
  }
  box.innerHTML =
    '<table><thead><tr><th>Device code</th><th>Location</th><th>Last seen</th></tr></thead><tbody>' +
    devices
      .map(
        (d) => `<tr>
          <td><code>${esc(d.device.deviceCode)}</code></td>
          <td><span class="inline-ic">${ICONS.pin}</span>${esc(d.location)}</td>
          <td>${fmtTime(d.device.lastSeenAt)}</td>
        </tr>`
      )
      .join('') +
    '</tbody></table>';
}

document.getElementById('loc-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('err-loc');
  err.classList.remove('show');
  try {
    await API.post('/locations', {
      name: document.getElementById('loc-name').value,
      address: document.getElementById('loc-address').value,
    });
    document.getElementById('loc-name').value = '';
    document.getElementById('loc-address').value = '';
    await loadLocations();
  } catch (ex) {
    showErr('err-loc', ex.message);
  }
});

document.getElementById('dev-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('err-dev');
  err.classList.remove('show');
  const deviceCode = document.getElementById('dev-code').value;
  const locationId = document.getElementById('dev-loc').value;
  if (!locationId) return showErr('err-dev', 'Please choose a location to connect the device to.');
  try {
    await API.post('/devices', { deviceCode, locationId });
    document.getElementById('dev-code').value = '';
    await loadLocations();
    err.textContent = 'Device connected successfully.';
    err.style.border = '1px solid rgba(34,197,94,.4)';
    err.style.background = 'rgba(34,197,94,.1)';
    err.style.color = '#4ade80';
    err.classList.add('show');
  } catch (ex) {
    showErr('err-dev', ex.message);
  }
});

const locParam = new URLSearchParams(window.location.search).get('loc');
loadLocations(locParam).catch(() => {});
