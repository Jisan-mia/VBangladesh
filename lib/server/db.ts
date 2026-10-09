import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// One SQLite file for the whole site. Set DATA_DIR to a persistent disk in production (a VPS path or a mounted volume).
let database: DatabaseSync | undefined;

export function db() {
  if (database) return database;
  const directory = process.env.DATA_DIR || join(process.cwd(), 'data');
  mkdirSync(directory, { recursive: true });
  database = new DatabaseSync(join(directory, 'ektukhani.db'));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS shares (id TEXT PRIMARY KEY, tool TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS shares_by_state ON shares (tool, state);
    CREATE TABLE IF NOT EXISTS tally_votes (tool TEXT NOT NULL, voter TEXT NOT NULL, items TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (tool, voter));
    CREATE TABLE IF NOT EXISTS tally_counts (tool TEXT NOT NULL, item TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (tool, item));
    CREATE TABLE IF NOT EXISTS suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, tool TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL);
  `);
  return database;
}

export function transaction<T>(work: () => T): T {
  const connection = db();
  connection.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    connection.exec('COMMIT');
    return result;
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
}
