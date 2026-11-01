const Database = require("better-sqlite3");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const DB_PATH = join(__dirname, "ace.db");
const SCHEMA_PATH = join(__dirname, "ace.sql");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// build the tables (safe every start — schema uses IF NOT EXISTS)
const schema = readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

module.exports = db;
