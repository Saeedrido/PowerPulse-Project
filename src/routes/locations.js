const express = require('express');
const q = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const { nowIso } = require('../db/database');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = q.all(
    `SELECT l.Id, l.Name, l.Address, l.CurrentStatus, l.LastStatusChangeAt, l.CreatedAt,
            d.Id AS DeviceId, d.DeviceCode, d.LastSeenAt
     FROM Locations l
     LEFT JOIN Devices d ON d.LocationId = l.Id AND d.IsActive = 1
     WHERE l.UserId = ?
     ORDER BY l.CreatedAt DESC`,
    [req.user.id]
  );
  return res.json({
    locations: rows.map((r) => ({
      id: r.Id,
      name: r.Name,
      address: r.Address,
      currentStatus: r.CurrentStatus,
      lastStatusChangeAt: r.LastStatusChangeAt,
      createdAt: r.CreatedAt,
      device: r.DeviceId
        ? { id: r.DeviceId, deviceCode: r.DeviceCode, lastSeenAt: r.LastSeenAt }
        : null,
    })),
  });
});

router.post('/', (req, res) => {
  const { name, address } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'Location name is required' });
  }
  const info = q.run(
    'INSERT INTO Locations (UserId, Name, Address, CurrentStatus, CreatedAt) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, address || null, 'UNKNOWN', nowIso()]
  );
  const location = q.get('SELECT * FROM Locations WHERE Id = ?', [info.lastInsertRowid]);
  return res.status(201).json({ location: locRow(location, null) });
});

router.get('/:id', (req, res) => {
  const location = findOwned(req, res);
  if (!location) return;
  const device = q.get(
    'SELECT * FROM Devices WHERE LocationId = ? AND IsActive = 1',
    [location.Id]
  );
  return res.json({ location: locRow(location, device) });
});

router.get('/:id/status', (req, res) => {
  const location = findOwned(req, res);
  if (!location) return;
  const device = q.get('SELECT * FROM Devices WHERE LocationId = ?', [location.Id]);
  return res.json({
    locationId: location.Id,
    name: location.Name,
    status: location.CurrentStatus,
    lastStatusChangeAt: location.LastStatusChangeAt,
    deviceLastSeenAt: device ? device.LastSeenAt : null,
  });
});

router.get('/:id/history', (req, res) => {
  const location = findOwned(req, res);
  if (!location) return;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const rows = q.all(
    `SELECT pe.Id, pe.Status, pe.RecordedAt
     FROM PowerEvents pe
     JOIN Devices d ON d.Id = pe.DeviceId
     WHERE d.LocationId = ?
     ORDER BY pe.RecordedAt DESC
     LIMIT ?`,
    [location.Id, limit]
  );
  return res.json({
    events: rows.map((r) => ({
      id: r.Id,
      status: r.Status,
      recordedAt: r.RecordedAt,
    })),
  });
});

function findOwned(req, res) {
  const location = q.get('SELECT * FROM Locations WHERE Id = ? AND UserId = ?', [
    req.params.id,
    req.user.id,
  ]);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return null;
  }
  return location;
}

function locRow(l, d) {
  return {
    id: l.Id,
    name: l.Name,
    address: l.Address,
    currentStatus: l.CurrentStatus,
    lastStatusChangeAt: l.LastStatusChangeAt,
    createdAt: l.CreatedAt,
    device: d
      ? {
          id: d.DeviceId || d.Id,
          deviceCode: d.DeviceCode,
          lastSeenAt: d.LastSeenAt,
        }
      : null,
  };
}

module.exports = router;
