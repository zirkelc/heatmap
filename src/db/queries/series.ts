import type { SQLiteDatabase } from 'expo-sqlite';
import type { Series } from '../schema';

/**
 * Get all series ordered by creation date (newest first).
 */
export function getAllSeries(db: SQLiteDatabase): Array<Series> {
  return db.getAllSync<Series>('SELECT * FROM series ORDER BY created_at DESC');
}

/**
 * Get a series by ID.
 */
export function getSeriesById(db: SQLiteDatabase, id: number): Series | null {
  return db.getFirstSync<Series>('SELECT * FROM series WHERE id = ?', [id]);
}

/**
 * Get the currently active series.
 */
export function getActiveSeries(db: SQLiteDatabase): Series | null {
  return db.getFirstSync<Series>('SELECT * FROM series WHERE is_active = 1');
}

/**
 * Create a new series.
 */
export function createSeries(
  db: SQLiteDatabase,
  name: string,
  city?: string | null,
  country?: string | null
): Series {
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO series (name, city, country, created_at, updated_at, is_active, point_count) VALUES (?, ?, ?, ?, ?, 0, 0)',
    [name, city ?? null, country ?? null, now, now]
  );
  return getSeriesById(db, result.lastInsertRowId)!;
}

/**
 * Update a series name.
 */
export function updateSeriesName(db: SQLiteDatabase, id: number, name: string): void {
  const now = new Date().toISOString();
  db.runSync('UPDATE series SET name = ?, updated_at = ? WHERE id = ?', [name, now, id]);
}

/**
 * Set a series as active (deactivates all others).
 */
export function setActiveSeries(db: SQLiteDatabase, id: number): void {
  const now = new Date().toISOString();
  db.runSync('UPDATE series SET is_active = 0');
  db.runSync('UPDATE series SET is_active = 1, updated_at = ? WHERE id = ?', [now, id]);
}

/**
 * Deactivate all series.
 */
export function deactivateAllSeries(db: SQLiteDatabase): void {
  db.runSync('UPDATE series SET is_active = 0');
}

/**
 * Delete a series (cascade deletes location points).
 */
export function deleteSeries(db: SQLiteDatabase, id: number): void {
  db.runSync('DELETE FROM series WHERE id = ?', [id]);
}

/**
 * Update the point count for a series.
 */
export function updateSeriesPointCount(db: SQLiteDatabase, id: number): void {
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE series SET point_count = (SELECT COUNT(*) FROM location_points WHERE series_id = ?), updated_at = ? WHERE id = ?',
    [id, now, id]
  );
}

/**
 * Merge multiple series into one target series.
 */
export function mergeSeries(db: SQLiteDatabase, targetId: number, sourceIds: Array<number>): void {
  const now = new Date().toISOString();

  for (const sourceId of sourceIds) {
    if (sourceId !== targetId) {
      db.runSync('UPDATE location_points SET series_id = ? WHERE series_id = ?', [targetId, sourceId]);
      db.runSync('DELETE FROM series WHERE id = ?', [sourceId]);
    }
  }

  db.runSync(
    'UPDATE series SET point_count = (SELECT COUNT(*) FROM location_points WHERE series_id = ?), updated_at = ? WHERE id = ?',
    [targetId, now, targetId]
  );
}
