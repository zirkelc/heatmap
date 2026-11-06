import { eq, inArray } from 'drizzle-orm';
import { settings } from '../schema';
import type { DB } from '../types';

export interface TrackingSettings {
  timeInterval: number;
  distanceInterval: number;
}

export const DEFAULT_SETTINGS: TrackingSettings = {
  timeInterval: 30_000,
  distanceInterval: 20,
};

/** The time intervals (in milliseconds) that the user can select */
export const TIME_INTERVAL_OPTIONS = [5_000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000];

/** The distance intervals (in meters) that the user can select */
export const DISTANCE_INTERVAL_OPTIONS = [5, 10, 20, 30, 50, 100, 200, 500];

/**
 * Index of the option that is nearest to the value. A saved value that is not an option
 * (for example from an older version of the app) shows as the nearest option.
 */
export function nearestOptionIndex(options: Array<number>, value: number): number {
  let nearest = 0;
  for (let i = 1; i < options.length; i++) {
    if (Math.abs(options[i] - value) < Math.abs(options[nearest] - value)) {
      nearest = i;
    }
  }
  return nearest;
}

/**
 * Get a setting value by key.
 */
export function getSetting(db: DB, key: string): string | null {
  const result = db.select().from(settings).where(eq(settings.key, key)).get();
  return result?.value ?? null;
}

/**
 * Set a setting value (upsert).
 */
export function setSetting(db: DB, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    })
    .run();
}

/**
 * Get all tracking settings in a single query.
 */
export function getTrackingSettings(db: DB): TrackingSettings {
  const rows = db
    .select()
    .from(settings)
    .where(inArray(settings.key, ['timeInterval', 'distanceInterval']))
    .all();

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    timeInterval: map.timeInterval ? Number(map.timeInterval) : DEFAULT_SETTINGS.timeInterval,
    distanceInterval: map.distanceInterval ? Number(map.distanceInterval) : DEFAULT_SETTINGS.distanceInterval,
  };
}

/**
 * Save tracking settings.
 */
export function saveTrackingSettings(db: DB, trackingSettings: TrackingSettings): void {
  setSetting(db, 'timeInterval', String(trackingSettings.timeInterval));
  setSetting(db, 'distanceInterval', String(trackingSettings.distanceInterval));
}
