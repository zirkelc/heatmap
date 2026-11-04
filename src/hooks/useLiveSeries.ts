import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, max, min } from 'drizzle-orm';
import { useDatabase } from '../contexts/DatabaseContext';
import { locations, series } from '../db/schema';

/**
 * Live query hook for all series, ordered by creation date.
 */
export function useLiveSeries() {
  const db = useDatabase();
  const { data, updatedAt } = useLiveQuery(
    db.select().from(series).orderBy(desc(series.createdAt))
  );
  return { series: data, loading: updatedAt === undefined };
}

/**
 * Live query hook for the currently active series.
 */
export function useLiveActiveSeries() {
  const db = useDatabase();
  const { data, updatedAt } = useLiveQuery(
    db.select().from(series).where(eq(series.isActive, true)).limit(1)
  );
  return { activeSeries: data[0] ?? null, loading: updatedAt === undefined };
}

/**
 * Live query hook for one series and the time range of its points.
 */
export function useLiveSeriesById(seriesId: number) {
  const db = useDatabase();
  const seriesQuery = useLiveQuery(
    db.select().from(series).where(eq(series.seriesId, seriesId)).limit(1),
    [db, seriesId]
  );
  const statsQuery = useLiveQuery(
    db
      .select({
        minTimestamp: min(locations.timestamp),
        maxTimestamp: max(locations.timestamp),
      })
      .from(locations)
      .where(eq(locations.seriesId, seriesId)),
    [db, seriesId]
  );

  return {
    series: seriesQuery.data[0] ?? null,
    stats: statsQuery.data[0] ?? null,
    loading: seriesQuery.updatedAt === undefined,
  };
}
