const express = require('express');
const q = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const { nowIso } = require('../db/database');
const powerService = require('../services/powerService');

const router = express.Router();

// ---- Public endpoint used by the IoT device (and simulator) ----
// A real physical device authenticates with its device code, not a user token.
router.post('/status', (req, res) => {
  const { deviceCode, status } = req.body || {};
  if (!deviceCode) {
    return res.status(400).json({ error: 'deviceCode is required' });
  }
  const device = q.get('SELECT * FROM Devices WHERE DeviceCode = ?', [deviceCode]);
  if (!device) {
    return res.status(404).json({ error: 'Device not found. Check the device code.' });
  }
  try {
    const result = powerService.recordDeviceStatus(device.Id, status);
    return res.json(result);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
});

// ---- Authenticated device management endpoints (user only) ----
router.use(requireAuth);

// Register a new device and (optionally) connect it to one of the user's locations.
router.post('/', (req, res) => {
  const { deviceCode, locationId } = req.body || {};
  if (!deviceCode) {
    return res.status(400).json({ error: 'deviceCode is required' });
  }

  if (locationId) {
    const location = q.get('SELECT * FROM Locations WHERE Id = ? AND UserId = ?', [
      locationId,
      req.user.id,
    ]);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
  }

  const existing = q.get('SELECT * FROM Devices WHERE DeviceCode = ?', [deviceCode]);
  if (existing) {
    if (locationId && existing.LocationId !== locationId) {
      q.run('UPDATE Devices SET LocationId = ?, IsActive = 1 WHERE Id = ?', [locationId, existing.Id]);
      const updated = q.get('SELECT * FROM Devices WHERE Id = ?', [existing.Id]);
      return res.status(200).json({ device: devRow(updated) });
    }
    return res.status(200).json({ device: devRow(existing) });
  }

  const info = q.run(
    'INSERT INTO Devices (DeviceCode, LocationId, IsActive, CreatedAt) VALUES (?, ?, 1, ?)',
    [deviceCode, locationId || null, nowIso()]
  );
  const device = q.get('SELECT * FROM Devices WHERE Id = ?', [info.lastInsertRowid]);
  return res.status(201).json({ device: devRow(device) });
});

router.get('/:id', (req, res) => {
  const device = findOwned(req, res);
  if (!device) return;
  return res.json({ device: devRow(device) });
});

function findOwned(req, res) {
  const device = q.get(
    `SELECT d.* FROM Devices d
     JOIN Locations l ON l.Id = d.LocationId
     WHERE d.Id = ? AND l.UserId = ?`,
    [req.params.id, req.user.id]
  );
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return null;
  }
  return device;
}

function devRow(d) {
  return {
    id: d.Id,
    deviceCode: d.DeviceCode,
    locationId: d.LocationId,
    isActive: !!d.IsActive,
    lastSeenAt: d.LastSeenAt,
    createdAt: d.CreatedAt,
  };
}

module.exports = router;
