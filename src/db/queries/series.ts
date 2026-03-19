import { eq, desc, sql, count } from 'drizzle-orm';
import { series, locations, type Series } from '../schema';
import type { getDatabase } from '../client';

type DB = ReturnType<typeof getDatabase>;

/**
 * Get all series ordered by creation date (newest first).
 */
export function getAllSeries(db: DB): Array<Series> {
  return db.select().from(series).orderBy(desc(series.createdAt)).all();
}

/**
 * Get a series by ID.
 */
export function getSeriesById(db: DB, id: number): Series | undefined {
  return db.select().from(series).where(eq(series.seriesId, id)).get();
}

/**
 * Get the currently active series.
 */
export function getActiveSeries(db: DB): Series | undefined {
  return db.select().from(series).where(eq(series.isActive, true)).get();
}

/**
 * Create a new series.
 */
export function createSeries(
  db: DB,
  name: string,
  city?: string | null,
  country?: string | null
): Series {
  return db
    .insert(series)
    .values({
      name,
      city: city ?? null,
      country: country ?? null,
      isActive: false,
      pointCount: 0,
    })
    .returning()
    .get();
}

/**
 * Update a series name.
 */
export function updateSeriesName(db: DB, id: number, name: string): void {
  db.update(series).set({ name }).where(eq(series.seriesId, id)).run();
}

/**
 * Set a series as active (deactivates all others).
 * Uses transaction for atomicity.
 */
export function setActiveSeries(db: DB, id: number): void {
  db.$client.withTransactionSync(() => {
    db.update(series).set({ isActive: false }).run();
    db.update(series).set({ isActive: true }).where(eq(series.seriesId, id)).run();
  });
}

/**
 * Deactivate all series.
 */
export function deactivateAllSeries(db: DB): void {
  db.update(series).set({ isActive: false }).run();
}

/**
 * Delete a series (cascade deletes location points).
 */
export function deleteSeries(db: DB, id: number): void {
  db.delete(series).where(eq(series.seriesId, id)).run();
}

/**
 * Update the point count for a series.
 */
export function updateSeriesPointCount(db: DB, id: number): void {
  const pointCountSubquery = db
    .select({ value: count() })
    .from(locations)
    .where(eq(locations.seriesId, id));

  db.update(series)
    .set({ pointCount: sql`(${pointCountSubquery})` })
    .where(eq(series.seriesId, id))
    .run();
}

/**
 * Merge multiple series into one target series.
 * Uses transaction for atomicity.
 */
export function mergeSeries(db: DB, targetId: number, sourceIds: Array<number>): void {
  db.$client.withTransactionSync(() => {
    for (const sourceId of sourceIds) {
      if (sourceId !== targetId) {
        db.update(locations)
          .set({ seriesId: targetId })
          .where(eq(locations.seriesId, sourceId))
          .run();
        db.delete(series).where(eq(series.seriesId, sourceId)).run();
      }
    }

    const pointCountSubquery = db
      .select({ value: count() })
      .from(locations)
      .where(eq(locations.seriesId, targetId));

    db.update(series)
      .set({ pointCount: sql`(${pointCountSubquery})` })
      .where(eq(series.seriesId, targetId))
      .run();
  });
}
