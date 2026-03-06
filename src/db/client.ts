import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';

const DB_NAME = 'heatmap.db';

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database instance.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync(DB_NAME);
    initializeDatabase(database);
  }
  return database;
}

/**
 * Initialize the database with schema migrations.
 */
function initializeDatabase(db: SQLite.SQLiteDatabase): void {
  db.execSync('PRAGMA foreign_keys = ON;');

  for (const migration of MIGRATIONS) {
    db.execSync(migration);
  }
}

/**
 * Get the database for background tasks (synchronous access).
 */
export function getDatabaseSync(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync(DB_NAME);
}
