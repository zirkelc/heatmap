import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'heatmap.db';

let rawDatabase: SQLite.SQLiteDatabase | null = null;
let drizzleInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the raw expo-sqlite database instance (for migrations).
 */
export function getRawDatabase(): SQLite.SQLiteDatabase {
  if (!rawDatabase) {
    rawDatabase = SQLite.openDatabaseSync(DB_NAME);
    rawDatabase.execSync('PRAGMA foreign_keys = ON;');
  }
  return rawDatabase;
}

/**
 * Get the Drizzle ORM instance.
 */
export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!drizzleInstance) {
    const raw = getRawDatabase();
    drizzleInstance = drizzle(raw, { schema });
  }
  return drizzleInstance;
}

/**
 * Get a Drizzle instance for background tasks (fresh connection).
 */
export function getDatabaseSync(): ReturnType<typeof drizzle<typeof schema>> {
  const raw = SQLite.openDatabaseSync(DB_NAME);
  raw.execSync('PRAGMA foreign_keys = ON;');
  return drizzle(raw, { schema });
}
