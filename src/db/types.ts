import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/**
 * A synchronous Drizzle SQLite database with the app schema.
 * The app uses the expo-sqlite driver. Tests use the sql.js driver.
 */
export type DB = BaseSQLiteDatabase<'sync', any, typeof schema>;
