const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'powerpulse.db');

let db = null;
let SQL = null;

function nowIso() {
  return new Date().toISOString();
}

async function init() {
  if (db) return db;

  SQL = await initSqlJs();

  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  migrate();
  persist();
  return db;
}

function migrate() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Email TEXT NOT NULL UNIQUE,
      PasswordHash TEXT NOT NULL,
      CreatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Locations (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER NOT NULL,
      Name TEXT NOT NULL,
      Address TEXT,
      CurrentStatus TEXT NOT NULL DEFAULT 'UNKNOWN',
      LastStatusChangeAt TEXT,
      CreatedAt TEXT NOT NULL,
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS Devices (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      DeviceCode TEXT NOT NULL UNIQUE,
      LocationId INTEGER,
      IsActive INTEGER NOT NULL DEFAULT 1,
      LastSeenAt TEXT,
      CreatedAt TEXT NOT NULL,
      FOREIGN KEY (LocationId) REFERENCES Locations(Id)
    );

    CREATE TABLE IF NOT EXISTS PowerEvents (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      DeviceId INTEGER NOT NULL,
      Status TEXT NOT NULL,
      RecordedAt TEXT NOT NULL,
      FOREIGN KEY (DeviceId) REFERENCES Devices(Id)
    );

    CREATE TABLE IF NOT EXISTS Notifications (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER NOT NULL,
      LocationId INTEGER,
      Message TEXT NOT NULL,
      Type TEXT NOT NULL,
      CreatedAt TEXT NOT NULL,
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
  `);
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function getDb() {
  if (!db) throw new Error('Database not initialised. Call init() first.');
  return db;
}

module.exports = { init, getDb, persist, nowIso, DB_FILE };
