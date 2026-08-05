const express = require('express');
const bcrypt = require('bcryptjs');
const q = require('../utils/db');
const { sign } = require('../middleware/auth');
const { nowIso } = require('../db/database');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const existing = q.get('SELECT Id FROM Users WHERE Email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const info = q.run(
    'INSERT INTO Users (Name, Email, PasswordHash, CreatedAt) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, nowIso()]
  );
  const user = q.get('SELECT Id, Name, Email, CreatedAt FROM Users WHERE Id = ?', [info.lastInsertRowid]);
  return res.status(201).json({ token: sign(user), user: camelCaseUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = q.get('SELECT * FROM Users WHERE Email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  return res.json({ token: sign(user), user: camelCaseUser(user) });
});

function camelCaseUser(u) {
  return { id: u.Id, name: u.Name, email: u.Email, createdAt: u.CreatedAt };
}

module.exports = router;
