import { desc, eq } from 'drizzle-orm';
import { locations, series } from '../schema';
import type { DB } from '../types';
import { updateSeriesPointCount } from './series';
import type { TrackingSettings } from './settings';

/** Points with a worse horizontal accuracy than this (in meters) are not saved */
export const MAX_ACCURACY_METERS = 100;

export interface RecordedLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  /** Speed in meters per second. iOS gives a negative value when the speed is not known. */
  speed?: number | null;
  /** Unix time in milliseconds */
  timestamp: number;
}

/** Up to this speed (in meters per second, about 9 km/h), a point has the full weight */
export const FULL_WEIGHT_MAX_SPEED = 2.5;

/** From this speed (in meters per second, about 36 km/h), a point has the minimum weight */
export const MIN_WEIGHT_SPEED = 10;

/** Weight of a point at driving speed */
export const MIN_WEIGHT = 0.2;

/**
 * Weight of a point on the heatmap, from the speed. When you walk, you see the street. When you
 * drive through it, you see less. So points at a higher speed count less. Between walking speed
 * and driving speed, the weight goes down linearly. A point without a known speed has the full weight.
 */
export function weightForSpeed(speed: number | null | undefined): number {
  if (speed == null || speed < 0 || speed <= FULL_WEIGHT_MAX_SPEED) {
    return 1;
  }
  if (speed >= MIN_WEIGHT_SPEED) {
    return MIN_WEIGHT;
  }
  const fraction = (speed - FULL_WEIGHT_MAX_SPEED) / (MIN_WEIGHT_SPEED - FULL_WEIGHT_MAX_SPEED);
  return 1 - fraction * (1 - MIN_WEIGHT);
}

/**
 * Remove points whose accuracy is unknown-bad. A point without accuracy is kept.
 */
export function filterAccurateLocations<LOCATION extends { accuracy?: number | null }>(
  locs: Array<LOCATION>
): Array<LOCATION> {
  return locs.filter((loc) => loc.accuracy == null || loc.accuracy <= MAX_ACCURACY_METERS);
}

interface SamplePoint {
  latitude: number;
  longitude: number;
  /** Unix time in milliseconds */
  timestamp: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Distance in meters between two points on the surface of the earth (haversine formula).
 */
export function distanceMeters(a: SamplePoint, b: SamplePoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLatitude = toRadians(b.latitude - a.latitude);
  const dLongitude = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Select the location updates to save. iOS sends about one update per second. A point is saved
 * when the user moved at least the distance interval since the last saved point, or when the
 * time interval passed since it. So the app also saves points while the user stays at one
 * place, and the places where the user stays long get many points.
 */
export function samplePoints<POINT extends SamplePoint>(
  lastSaved: SamplePoint | null,
  candidates: Array<POINT>,
  trackingSettings: TrackingSettings
): Array<POINT> {
  const selected: Array<POINT> = [];
  let last = lastSaved;
  for (const candidate of candidates) {
    const due =
      last === null ||
      candidate.timestamp - last.timestamp >= trackingSettings.timeInterval ||
      distanceMeters(last, candidate) >= trackingSettings.distanceInterval;
    if (due) {
      selected.push(candidate);
      last = candidate;
    }
  }
  return selected;
}

/**
 * Save location updates to the active series and update its point count.
 * Only the points that the tracking settings select are saved.
 * Returns null if no series is active, so the caller knows the points were not saved.
 */
export function recordLocations(
  db: DB,
  locs: Array<RecordedLocation>,
  trackingSettings: TrackingSettings
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

    const lastSaved = tx
      .select({ latitude: locations.latitude, longitude: locations.longitude, timestamp: locations.timestamp })
      .from(locations)
      .where(eq(locations.seriesId, activeSeries.seriesId))
      .orderBy(desc(locations.locationId))
      .limit(1)
      .get();

    const selected = samplePoints(
      lastSaved ? { ...lastSaved, timestamp: Date.parse(lastSaved.timestamp) } : null,
      filterAccurateLocations(locs),
      trackingSettings
    );
    if (selected.length > 0) {
      tx.insert(locations)
        .values(
          selected.map((loc) => ({
            seriesId: activeSeries.seriesId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude ?? null,
            accuracy: loc.accuracy ?? null,
            timestamp: new Date(loc.timestamp).toISOString(),
            weight: weightForSpeed(loc.speed),
          }))
        )
        .run();
      updateSeriesPointCount(tx, activeSeries.seriesId);
    }

    return { seriesId: activeSeries.seriesId, saved: selected.length };
  });
}
