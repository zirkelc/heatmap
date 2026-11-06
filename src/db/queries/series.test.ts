import { beforeEach, describe, expect, test } from 'vitest';
import { createTestDatabase } from '../testing';
import type { DB } from '../types';
import { locations } from '../schema';
import {
  createSeries,
  deleteSeries,
  getActiveSeries,
  getAllSeries,
  getSeriesById,
  mergeSeries,
  setActiveSeries,
} from './series';
import { recordLocations } from './locations';

const POINT = { latitude: 52.52, longitude: 13.405, accuracy: 10, timestamp: 1_700_000_000_000 };

let db: DB;

beforeEach(async () => {
  db = await createTestDatabase();
});

function addPoints(seriesId: number, amount: number): void {
  setActiveSeries(db, seriesId);
  recordLocations(
    db,
    Array.from({ length: amount }, (_, i) => ({ ...POINT, timestamp: POINT.timestamp + i * 1_000 })),
    { timeInterval: 0, distanceInterval: 0 }
  );
}

describe('setActiveSeries', () => {
  test('should make only the given series active', () => {
    // Arrange
    const first = createSeries(db, 'First');
    const second = createSeries(db, 'Second');
    setActiveSeries(db, first.seriesId);

    // Act
    setActiveSeries(db, second.seriesId);

    // Assert
    expect(getActiveSeries(db)?.seriesId).toBe(second.seriesId);
    expect(getSeriesById(db, first.seriesId)?.isActive).toBe(false);
  });
});

describe('deleteSeries', () => {
  test('should delete the points of the series', () => {
    // Arrange
    const kept = createSeries(db, 'Kept');
    const removed = createSeries(db, 'Removed');
    addPoints(kept.seriesId, 2);
    addPoints(removed.seriesId, 3);

    // Act
    deleteSeries(db, removed.seriesId);

    // Assert
    expect(getAllSeries(db).map((s) => s.seriesId)).toEqual([kept.seriesId]);
    expect(db.select().from(locations).all().length).toBe(2);
  });
});

describe('mergeSeries', () => {
  test('should move all points to the target, delete the sources and update the point count', () => {
    // Arrange
    const target = createSeries(db, 'Target');
    const sourceA = createSeries(db, 'Source A');
    const sourceB = createSeries(db, 'Source B');
    addPoints(target.seriesId, 1);
    addPoints(sourceA.seriesId, 2);
    addPoints(sourceB.seriesId, 3);

    // Act
    mergeSeries(db, target.seriesId, [sourceA.seriesId, sourceB.seriesId, target.seriesId]);

    // Assert
    expect(getAllSeries(db).map((s) => s.seriesId)).toEqual([target.seriesId]);
    expect(getSeriesById(db, target.seriesId)?.pointCount).toBe(6);
    const seriesIds = new Set(db.select().from(locations).all().map((loc) => loc.seriesId));
    expect([...seriesIds]).toEqual([target.seriesId]);
  });
});
