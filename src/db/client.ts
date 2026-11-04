import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'heatmap.db';

let drizzleInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the shared Drizzle ORM instance. The app and the background location task
 * use the same connection, so no connection is opened per location update.
 */
export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!drizzleInstance) {
    const raw = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true });
    raw.execSync('PRAGMA foreign_keys = ON;');
    drizzleInstance = drizzle(raw, { schema });
  }
  return drizzleInstance;
}
