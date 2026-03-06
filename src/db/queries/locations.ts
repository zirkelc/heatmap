import type { SQLiteDatabase } from 'expo-sqlite';
import type { LocationPoint } from '../schema';

/**
 * Get all location points for a series.
 */
export function getLocationsBySeries(db: SQLiteDatabase, seriesId: number): Array<LocationPoint> {
  return db.getAllSync<LocationPoint>(
    'SELECT * FROM location_points WHERE series_id = ? ORDER BY timestamp ASC',
    [seriesId]
  );
}

/**
 * Get all location points for multiple series (for heatmap display).
 */
export function getLocationsBySeriesIds(db: SQLiteDatabase, seriesIds: Array<number>): Array<LocationPoint> {
  if (seriesIds.length === 0) return [];

  const placeholders = seriesIds.map(() => '?').join(',');
  return db.getAllSync<LocationPoint>(
    `SELECT * FROM location_points WHERE series_id IN (${placeholders}) ORDER BY timestamp ASC`,
    seriesIds
  );
}

/**
 * Get all location points (for displaying all data on heatmap).
 */
export function getAllLocations(db: SQLiteDatabase): Array<LocationPoint> {
  return db.getAllSync<LocationPoint>('SELECT * FROM location_points ORDER BY timestamp ASC');
}

/**
 * Insert a new location point.
 */
export function insertLocation(
  db: SQLiteDatabase,
  seriesId: number,
  latitude: number,
  longitude: number,
  altitude?: number | null,
  accuracy?: number | null,
  timestamp?: string,
  weight?: number
): void {
  const ts = timestamp ?? new Date().toISOString();
  db.runSync(
    'INSERT INTO location_points (series_id, latitude, longitude, altitude, accuracy, timestamp, weight) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [seriesId, latitude, longitude, altitude ?? null, accuracy ?? null, ts, weight ?? 1.0]
  );
}

/**
 * Insert multiple location points in a batch.
 */
export function insertLocationsBatch(
  db: SQLiteDatabase,
  seriesId: number,
  locations: Array<{
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    timestamp?: string;
    weight?: number;
  }>
): void {
  for (const loc of locations) {
    insertLocation(
      db,
      seriesId,
      loc.latitude,
      loc.longitude,
      loc.altitude,
      loc.accuracy,
      loc.timestamp,
      loc.weight
    );
  }
}

/**
 * Delete all location points for a series.
 */
export function deleteLocationsBySeries(db: SQLiteDatabase, seriesId: number): void {
  db.runSync('DELETE FROM location_points WHERE series_id = ?', [seriesId]);
}

/**
 * Get the first location point of a series (for reverse geocoding).
 */
export function getFirstLocation(db: SQLiteDatabase, seriesId: number): LocationPoint | null {
  return db.getFirstSync<LocationPoint>(
    'SELECT * FROM location_points WHERE series_id = ? ORDER BY timestamp ASC LIMIT 1',
    [seriesId]
  );
}

/**
 * Get location stats for a series.
 */
export function getLocationStats(
  db: SQLiteDatabase,
  seriesId: number
): { count: number; minTimestamp: string | null; maxTimestamp: string | null } | null {
  return db.getFirstSync<{ count: number; minTimestamp: string | null; maxTimestamp: string | null }>(
    'SELECT COUNT(*) as count, MIN(timestamp) as minTimestamp, MAX(timestamp) as maxTimestamp FROM location_points WHERE series_id = ?',
    [seriesId]
  );
}
