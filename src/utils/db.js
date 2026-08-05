const dbModule = require('../db/database');

// Run a statement with params and return { lastInsertRowid, changes }.
function run(sql, params = []) {
  const db = dbModule.getDb();
  db.run(sql, params);
  const rowidRow = db.exec('SELECT last_insert_rowid() AS id');
  const lastInsertRowid = rowidRow.length ? rowidRow[0].values[0][0] : 0;
  const changes = db.getRowsModified();
  dbModule.persist();
  return { lastInsertRowid, changes };
}

// Run a SELECT and return rows as objects.
function all(sql, params = []) {
  const db = dbModule.getDb();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return rows;
  } finally {
    stmt.free();
  }
}

// Run a SELECT and return a single row or null.
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length ? rows[0] : null;
}

module.exports = { run, all, get };
