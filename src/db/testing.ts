import path from 'node:path';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import * as schema from './schema';
import type { DB } from './types';

/**
 * Create an in-memory database with the app schema, for tests only.
 * It runs the same migrations as the app.
 */
export async function createTestDatabase(): Promise<DB> {
  const SQL = await initSqlJs();
  const client = new SQL.Database();
  client.run('PRAGMA foreign_keys = ON;');
  const db = drizzle(client, { schema });
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  return db;
}
