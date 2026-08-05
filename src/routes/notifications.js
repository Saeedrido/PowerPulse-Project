const express = require('express');
const { requireAuth } = require('../middleware/auth');
const notifications = require('../services/notificationService');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const items = notifications.getNotificationsForUser(req.user.id, limit);
  res.json({ notifications: items });
});

module.exports = router;
