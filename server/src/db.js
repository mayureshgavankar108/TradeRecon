const database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.NODE_ENV === "test" ? ":memory:" : process.env.DB_PATH || path.join(__dirname, "../traderecon.db");

const db = new database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS recon_runs (
        r_id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        total_internal INTEGER NOT NULL,
        total_custodian INTEGER NOT NULL,
        matched INTEGER NOT NULL,
        breaks INTEGER NOT NULL
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS breaks (
        break_id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        trade_id TEXT NOT NULL,
        break_type TEXT NOT NULL,
        internal_qty REAL,
        custodian_qty REAL,
        internal_price REAL,
        custodian_price REAL,
        FOREIGN KEY (run_id) REFERENCES recon_runs(r_id)
    );
`);

module.exports = db;
