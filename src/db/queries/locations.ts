import { eq, inArray, asc, count, min, max } from 'drizzle-orm';
import { locations, type Location } from '../schema';
import type { getDatabase } from '../client';

type DB = ReturnType<typeof getDatabase>;

/**
 * Get all location points for a series.
 */
export function getLocationsBySeries(db: DB, seriesId: number): Array<Location> {
  return db
    .select()
    .from(locations)
    .where(eq(locations.seriesId, seriesId))
    .orderBy(asc(locations.timestamp))
    .all();
}

/**
 * Get all location points for multiple series (for heatmap display).
 */
export function getLocationsBySeriesIds(db: DB, seriesIds: Array<number>): Array<Location> {
  if (seriesIds.length === 0) return [];

  return db
    .select()
    .from(locations)
    .where(inArray(locations.seriesId, seriesIds))
    .orderBy(asc(locations.timestamp))
    .all();
}

/**
 * Get all location points (for displaying all data on heatmap).
 */
export function getAllLocations(db: DB): Array<Location> {
  return db.select().from(locations).orderBy(asc(locations.timestamp)).all();
}

/**
 * Insert a new location point.
 */
export function insertLocation(
  db: DB,
  seriesId: number,
  latitude: number,
  longitude: number,
  altitude?: number | null,
  accuracy?: number | null,
  timestamp?: string,
  weight?: number
): void {
  const ts = timestamp ?? new Date().toISOString();
  db.insert(locations)
    .values({
      seriesId,
      latitude,
      longitude,
      altitude: altitude ?? null,
      accuracy: accuracy ?? null,
      timestamp: ts,
      weight: weight ?? 1.0,
    })
    .run();
}

/**
 * Insert multiple location points in a batch using multi-value insert.
 */
export function insertLocationsBatch(
  db: DB,
  seriesId: number,
  locs: Array<{
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    timestamp?: string;
    weight?: number;
  }>
): void {
  if (locs.length === 0) return;

  db.insert(locations)
    .values(
      locs.map((loc) => ({
        seriesId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude ?? null,
        accuracy: loc.accuracy ?? null,
        timestamp: loc.timestamp ?? new Date().toISOString(),
        weight: loc.weight ?? 1.0,
      }))
    )
    .run();
}

/**
 * Delete all location points for a series.
 */
export function deleteLocationsBySeries(db: DB, seriesId: number): void {
  db.delete(locations).where(eq(locations.seriesId, seriesId)).run();
}

/**
 * Get the first location point of a series (for reverse geocoding).
 */
export function getFirstLocation(db: DB, seriesId: number): Location | undefined {
  return db
    .select()
    .from(locations)
    .where(eq(locations.seriesId, seriesId))
    .orderBy(asc(locations.timestamp))
    .limit(1)
    .get();
}

/**
 * Get location stats for a series.
 */
export function getLocationStats(
  db: DB,
  seriesId: number
): { count: number; minTimestamp: string | null; maxTimestamp: string | null } | undefined {
  return db
    .select({
      count: count(),
      minTimestamp: min(locations.timestamp),
      maxTimestamp: max(locations.timestamp),
    })
    .from(locations)
    .where(eq(locations.seriesId, seriesId))
    .get();
}
