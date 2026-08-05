const dbModule = require('../db/database');
const notifications = require('./notificationService');

// Accepts a status update from an IoT device, validates it, updates the current
// location status, records a PowerEvent, and triggers a notification when the
// power state actually changes.
function recordDeviceStatus(deviceId, status) {
  const db = dbModule.getDb();
  const now = dbModule.nowIso();

  const deviceRows = db.exec('SELECT * FROM Devices WHERE Id = ?', [deviceId]);
  if (!deviceRows.length) {
    const err = new Error('Device not found');
    err.status = 404;
    throw err;
  }
  const device = deviceRows[0].values[0];
  const cols = deviceRows[0].columns;
  const deviceObj = rowToObject(cols, device);

  if (!deviceObj.IsActive) {
    const err = new Error('Device is not active');
    err.status = 403;
    throw err;
  }

  if (!['ON', 'OFF'].includes(status)) {
    const err = new Error('Invalid status. Must be ON or OFF');
    err.status = 400;
    throw err;
  }

  // Update device last-seen time.
  db.run('UPDATE Devices SET LastSeenAt = ? WHERE Id = ?', [now, deviceId]);

  let location = null;
  let powerChanged = false;

  if (deviceObj.LocationId) {
    const locRows = db.exec('SELECT * FROM Locations WHERE Id = ?', [deviceObj.LocationId]);
    if (locRows.length) {
      const locCols = locRows[0].columns;
      location = rowToObject(locCols, locRows[0].values[0]);

      const previous = location.CurrentStatus;
      if (previous !== status) {
        powerChanged = true;
        db.run(
          'UPDATE Locations SET CurrentStatus = ?, LastStatusChangeAt = ? WHERE Id = ?',
          [status, now, location.Id]
        );
      }
    }
  }

  // Record every status change as a power event.
  db.run(
    'INSERT INTO PowerEvents (DeviceId, Status, RecordedAt) VALUES (?, ?, ?)',
    [deviceId, status, now]
  );

  dbModule.persist();

  // Notify when the power state actually changed.
  if (powerChanged && location) {
    const message =
      status === 'OFF'
        ? `Power has gone off at ${location.Name}.`
        : `Power has been restored at ${location.Name}.`;
    notifications.dispatch(location.UserId, location.Id, message, status === 'OFF' ? 'POWER_OFF' : 'POWER_ON');
  }

  return {
    deviceId,
    status,
    powerChanged,
    location: location
      ? {
          id: location.Id,
          name: location.Name,
          currentStatus: status,
          lastStatusChangeAt: now,
        }
      : null,
    recordedAt: now,
  };
}

function rowToObject(columns, values) {
  const obj = {};
  columns.forEach((c, i) => {
    obj[c] = values[i];
  });
  return obj;
}

module.exports = { recordDeviceStatus };
