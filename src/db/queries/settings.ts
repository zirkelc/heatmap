import type { SQLiteDatabase } from 'expo-sqlite';

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
export function getSetting(db: SQLiteDatabase, key: string): string | null {
  const result = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return result?.value ?? null;
}

/**
 * Set a setting value.
 */
export function setSetting(db: SQLiteDatabase, key: string, value: string): void {
  db.runSync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

/**
 * Get all tracking settings.
 */
export function getTrackingSettings(db: SQLiteDatabase): TrackingSettings {
  const timeInterval = getSetting(db, 'timeInterval');
  const distanceInterval = getSetting(db, 'distanceInterval');

  return {
    timeInterval: timeInterval ? Number(timeInterval) : DEFAULT_SETTINGS.timeInterval,
    distanceInterval: distanceInterval ? Number(distanceInterval) : DEFAULT_SETTINGS.distanceInterval,
  };
}

/**
 * Save tracking settings.
 */
export function saveTrackingSettings(db: SQLiteDatabase, settings: TrackingSettings): void {
  setSetting(db, 'timeInterval', String(settings.timeInterval));
  setSetting(db, 'distanceInterval', String(settings.distanceInterval));
}
