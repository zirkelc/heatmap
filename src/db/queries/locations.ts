import { eq } from 'drizzle-orm';
import { locations, series } from '../schema';
import type { DB } from '../types';
import { updateSeriesPointCount } from './series';

/** Points with a worse horizontal accuracy than this (in meters) are not saved */
export const MAX_ACCURACY_METERS = 100;

export interface RecordedLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  /** Unix time in milliseconds */
  timestamp: number;
}

/**
 * Remove points whose accuracy is unknown-bad. A point without accuracy is kept.
 */
export function filterAccurateLocations<LOCATION extends { accuracy?: number | null }>(
  locs: Array<LOCATION>
): Array<LOCATION> {
  return locs.filter((loc) => loc.accuracy == null || loc.accuracy <= MAX_ACCURACY_METERS);
}

/**
 * Save location updates to the active series and update its point count.
 * Returns null if no series is active, so the caller knows the points were not saved.
 */
export function recordLocations(
  db: DB,
  locs: Array<RecordedLocation>
): { seriesId: number; saved: number } | null {
  return db.transaction((tx) => {
    const activeSeries = tx
      .select({ seriesId: series.seriesId })
      .from(series)
      .where(eq(series.isActive, true))
      .get();

    if (!activeSeries) {
      return null;
    }

    const accurate = filterAccurateLocations(locs);
    if (accurate.length > 0) {
      tx.insert(locations)
        .values(
          accurate.map((loc) => ({
            seriesId: activeSeries.seriesId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude ?? null,
            accuracy: loc.accuracy ?? null,
            timestamp: new Date(loc.timestamp).toISOString(),
            weight: 1,
          }))
        )
        .run();
      updateSeriesPointCount(tx, activeSeries.seriesId);
    }

    return { seriesId: activeSeries.seriesId, saved: accurate.length };
  });
}
