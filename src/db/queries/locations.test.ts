import { beforeEach, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase } from '../testing';
import type { DB } from '../types';
import { locations } from '../schema';
import { createSeries, getSeriesById, setActiveSeries } from './series';
import { filterAccurateLocations, recordLocations, MAX_ACCURACY_METERS } from './locations';

const POINT = { latitude: 52.52, longitude: 13.405, altitude: 34, accuracy: 10, timestamp: 1_700_000_000_000 };

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

describe('recordLocations', () => {
  test('should save points to the active series and update its point count', () => {
    // Arrange
    const inactive = createSeries(db, 'Inactive');
    const active = createSeries(db, 'Active');
    setActiveSeries(db, active.seriesId);

    // Act
    const result = recordLocations(db, [POINT, { ...POINT, timestamp: POINT.timestamp + 60_000 }]);

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
    const result = recordLocations(db, [POINT, { ...POINT, accuracy: 500 }]);

    // Assert
    expect(result).toEqual({ seriesId: active.seriesId, saved: 1 });
    expect(getSeriesById(db, active.seriesId)?.pointCount).toBe(1);
  });

  test('should return null and save nothing when no series is active', () => {
    // Arrange
    createSeries(db, 'Inactive');

    // Act
    const result = recordLocations(db, [POINT]);

    // Assert
    expect(result).toBe(null);
    expect(db.select().from(locations).all().length).toBe(0);
  });
});
