import { beforeEach, describe, expect, test } from 'vitest';
import { count, eq } from 'drizzle-orm';
import { createTestDatabase } from '../db/testing';
import type { DB } from '../db/types';
import { locations } from '../db/schema';
import { createSeries, getAllSeries } from '../db/queries/series';
import { seedDemoData } from './demoData';

let db: DB;

beforeEach(async () => {
  db = await createTestDatabase();
});

describe('seedDemoData', () => {
  test('should create series whose point count matches the saved points', () => {
    // Act
    const created = seedDemoData(db);

    // Assert
    const all = getAllSeries(db);
    expect(all.length).toBe(created);
    for (const item of all) {
      const saved = db.select({ value: count() }).from(locations).where(eq(locations.seriesId, item.seriesId)).get();
      expect(item.pointCount).toBe(saved?.value);
    }
  });

  test('should not change a database that has data', () => {
    // Arrange
    createSeries(db, 'Mine');

    // Act
    const created = seedDemoData(db);

    // Assert
    expect(created).toBe(0);
    expect(getAllSeries(db).map((s) => s.name)).toEqual(['Mine']);
  });
});
