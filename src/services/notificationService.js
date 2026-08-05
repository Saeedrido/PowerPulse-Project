const dbModule = require('../db/database');

function createNotification(userId, locationId, message, type) {
  const db = dbModule.getDb();
  db.run(
    'INSERT INTO Notifications (UserId, LocationId, Message, Type, CreatedAt) VALUES (?, ?, ?, ?, ?)',
    [userId, locationId, message, type, dbModule.nowIso()]
  );
  dbModule.persist();
}

function getNotificationsForUser(userId, limit = 20) {
  const db = dbModule.getDb();
  const rows = db.exec(
    `SELECT Id, LocationId, Message, Type, CreatedAt
     FROM Notifications
     WHERE UserId = ?
     ORDER BY CreatedAt DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows.length ? rows[0].values.map(toObj) : [];
}

function toObj([Id, LocationId, Message, Type, CreatedAt]) {
  return { id: Id, locationId: LocationId, message: Message, type: Type, createdAt: CreatedAt };
}

// Future channels (email/SMS/push/WhatsApp) plug in here without touching core logic.
function dispatch(userId, locationId, message, type) {
  createNotification(userId, locationId, message, type);
}

module.exports = { createNotification, getNotificationsForUser, dispatch };
