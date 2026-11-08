import { beforeEach, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase } from '../testing';
import type { DB } from '../types';
import { locations } from '../schema';
import { createSeries, getSeriesById, setActiveSeries } from './series';
import {
  distanceMeters,
  filterAccurateLocations,
  recordLocations,
  samplePoints,
  weightForSpeed,
  MAX_ACCURACY_METERS,
  MIN_WEIGHT,
} from './locations';

const POINT = { latitude: 52.52, longitude: 13.405, altitude: 34, accuracy: 10, timestamp: 1_700_000_000_000 };

/** Settings that save every point */
const SAVE_ALL = { timeInterval: 0, distanceInterval: 0 };

/** One meter to the north, in degrees of latitude */
const METER = 1 / 111_195;

let db: DB;

beforeEach(async () => {
  db = await createTestDatabase();
});

describe('filterAccurateLocations', () => {
  test('should keep points within the accuracy limit and points without accuracy', () => {
    // Arrange
    const input = [
      { accuracy: 5 },
      { accuracy: MAX_ACCURACY_METERS },
      { accuracy: MAX_ACCURACY_METERS + 1 },
      { accuracy: null },
      {},
    ];

    // Act
    const result = filterAccurateLocations(input);

    // Assert
    expect(result).toEqual([{ accuracy: 5 }, { accuracy: MAX_ACCURACY_METERS }, { accuracy: null }, {}]);
  });
});

describe('distanceMeters', () => {
  test('should return the distance between two points', () => {
    // Arrange
    const north = { ...POINT, latitude: POINT.latitude + 100 * METER };

    // Act
    const result = distanceMeters(POINT, north);

    // Assert
    expect(Math.round(result)).toBe(100);
  });
});

describe('samplePoints', () => {
  const settings = { timeInterval: 30_000, distanceInterval: 20 };

  test('should save a point after the distance interval', () => {
    // Arrange
    const walk = [0, 10, 19, 21, 30, 45].map((meters, i) => ({
      ...POINT,
      latitude: POINT.latitude + meters * METER,
      timestamp: POINT.timestamp + i * 1_000,
    }));

    // Act
    const result = samplePoints(null, walk, settings);

    // Assert
    expect(result).toEqual([walk[0], walk[3], walk[5]]);
  });

  test('should save a point after the time interval when the user does not move', () => {
    // Arrange
    const stay = [0, 10_000, 29_000, 30_000, 45_000, 60_000].map((ms) => ({ ...POINT, timestamp: POINT.timestamp + ms }));

    // Act
    const result = samplePoints(null, stay, settings);

    // Assert
    expect(result).toEqual([stay[0], stay[3], stay[5]]);
  });

  test('should continue from the last saved point', () => {
    // Arrange
    const lastSaved = { ...POINT, timestamp: POINT.timestamp - 20_000 };
    const candidates = [0, 10_000].map((ms) => ({ ...POINT, timestamp: POINT.timestamp + ms }));

    // Act
    const result = samplePoints(lastSaved, candidates, settings);

    // Assert
    expect(result).toEqual([candidates[1]]);
  });
});

describe('weightForSpeed', () => {
  test('should give the full weight at walking speed and when the speed is not known', () => {
    // Arrange
    const speeds = [0, 1.4, 2.5, -1, null, undefined];

    // Act
    const result = speeds.map(weightForSpeed);

    // Assert
    expect(result).toEqual([1, 1, 1, 1, 1, 1]);
  });

  test('should give the minimum weight at driving speed', () => {
    // Arrange
    const speeds = [10, 14, 30];

    // Act
    const result = speeds.map(weightForSpeed);

    // Assert
    expect(result).toEqual([MIN_WEIGHT, MIN_WEIGHT, MIN_WEIGHT]);
  });

  test('should decrease the weight linearly between walking and driving speed', () => {
    // Arrange
    const halfway = (2.5 + 10) / 2;

    // Act
    const result = weightForSpeed(halfway);

    // Assert
    expect(result).toBeCloseTo(0.6);
  });
});

describe('recordLocations', () => {
  test('should save points to the active series and update its point count', () => {
    // Arrange
    const inactive = createSeries(db, 'Inactive');
    const active = createSeries(db, 'Active');
    setActiveSeries(db, active.seriesId);

    // Act
    const result = recordLocations(db, [POINT, { ...POINT, timestamp: POINT.timestamp + 60_000 }], SAVE_ALL);

    // Assert
    expect(result).toEqual({ seriesId: active.seriesId, saved: 2 });
    expect(getSeriesById(db, active.seriesId)?.pointCount).toBe(2);
    expect(getSeriesById(db, inactive.seriesId)?.pointCount).toBe(0);
    const saved = db.select().from(locations).where(eq(locations.seriesId, active.seriesId)).all();
    expect(saved.map((loc) => loc.timestamp)).toEqual([
      '2023-11-14T22:13:20.000Z',
      '2023-11-14T22:14:20.000Z',
    ]);
  });

  test('should not save inaccurate points', () => {
    // Arrange
    const active = createSeries(db, 'Active');
    setActiveSeries(db, active.seriesId);

    // Act
    const result = recordLocations(db, [POINT, { ...POINT, accuracy: 500 }], SAVE_ALL);

    // Assert
    expect(result).toEqual({ seriesId: active.seriesId, saved: 1 });
    expect(getSeriesById(db, active.seriesId)?.pointCount).toBe(1);
  });

  test('should apply the tracking settings from the last saved point of the series', () => {
    // Arrange
    const active = createSeries(db, 'Active');
    setActiveSeries(db, active.seriesId);
    const settings = { timeInterval: 30_000, distanceInterval: 20 };
    recordLocations(db, [POINT], settings);
    const nextBatch = [10_000, 30_000, 40_000].map((ms) => ({ ...POINT, timestamp: POINT.timestamp + ms }));

    // Act
    const result = recordLocations(db, nextBatch, settings);

    // Assert
    expect(result).toEqual({ seriesId: active.seriesId, saved: 1 });
    expect(getSeriesById(db, active.seriesId)?.pointCount).toBe(2);
  });

  test('should save the weight from the speed', () => {
    // Arrange
    const active = createSeries(db, 'Active');
    setActiveSeries(db, active.seriesId);

    // Act
    recordLocations(db, [{ ...POINT, speed: 1 }, { ...POINT, speed: 20, timestamp: POINT.timestamp + 1_000 }], SAVE_ALL);

    // Assert
    const saved = db.select().from(locations).where(eq(locations.seriesId, active.seriesId)).all();
    expect(saved.map((loc) => loc.weight)).toEqual([1, MIN_WEIGHT]);
  });

  test('should return null and save nothing when no series is active', () => {
    // Arrange
    createSeries(db, 'Inactive');

    // Act
    const result = recordLocations(db, [POINT], SAVE_ALL);

    // Assert
    expect(result).toBe(null);
    expect(db.select().from(locations).all().length).toBe(0);
  });
});
