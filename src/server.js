const path = require('path');
const express = require('express');
const cors = require('cors');
const database = require('./db/database');

const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const deviceRoutes = require('./routes/devices');
const notificationRoutes = require('./routes/notifications');

const PORT = process.env.PORT || 3000;

async function main() {
  await database.init();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/locations', locationRoutes);
  app.use('/devices', deviceRoutes);
  app.use('/notifications', notificationRoutes);

  // Serve the frontend and simulator as static files.
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/simulator', express.static(path.join(__dirname, '..', 'simulator')));

  app.get('/health', (req, res) => res.json({ ok: true, time: database.nowIso() }));

  app.listen(PORT, () => {
    console.log(`PowerPulse running at http://localhost:${PORT}`);
    console.log(`Dashboard:      http://localhost:${PORT}`);
    console.log(`IoT Simulator:  http://localhost:${PORT}/simulator/simulator.html`);
  });
}

main().catch((err) => {
  console.error('Failed to start PowerPulse:', err);
  process.exit(1);
});
