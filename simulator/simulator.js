let state = 'OFF';
const BASE = '';

function log(msg, type) {
  const box = document.getElementById('sim-log');
  const time = new Date().toLocaleTimeString();
  const color = type === 'error' ? '#fca5a5' : type === 'ok' ? '#86efac' : '#93c5fd';
  box.innerHTML = `<div style="color:${color}">[${time}] ${msg}</div>` + box.innerHTML;
  if (box.children.length > 40) box.lastElementChild.remove();
}

function setState(s) {
  state = s;
  const light = document.getElementById('sim-light');
  const status = document.getElementById('sim-status');
  light.className = 'sim-light ' + String(s).toLowerCase();
  status.className = 'sim-status ' + String(s).toLowerCase();
  status.textContent = s === 'ON' ? '🟢 POWER AVAILABLE' : '🔴 POWER UNAVAILABLE';
}

function showErr(msg) {
  const el = document.getElementById('sim-err');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

async function sendStatus(status) {
  const deviceCode = document.getElementById('sim-code-input').value.trim();
  if (!deviceCode) return showErr('Enter a device code.');
  log(`Sending ${status} for device ${deviceCode}…`);
  try {
    const res = await fetch(BASE + '/devices/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceCode, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }
    setState(status);
    log(`✔ Server accepted ${status}. Power event recorded at ${new Date(data.recordedAt).toLocaleTimeString()}.`, 'ok');
    if (data.location) {
      log(`   Updated location: ${data.location.name} → ${status}`, 'ok');
    }
  } catch (err) {
    showErr(err.message);
    log(`✖ ${err.message}`, 'error');
  }
}

document.getElementById('btn-on').addEventListener('click', () => sendStatus('ON'));
document.getElementById('btn-off').addEventListener('click', () => sendStatus('OFF'));
document.getElementById('sim-code-input').addEventListener('change', () => log(`Device code set to ${document.getElementById('sim-code-input').value.trim()}`));

setState('OFF');
log('Simulator ready. Click POWER ON or POWER OFF to send a status update.');
