import { eq, inArray } from 'drizzle-orm';
import { settings } from '../schema';
import type { DB } from '../types';

export interface TrackingSettings {
  timeInterval: number;
  distanceInterval: number;
}

export const DEFAULT_SETTINGS: TrackingSettings = {
  timeInterval: 60_000,
  distanceInterval: 50,
};

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
