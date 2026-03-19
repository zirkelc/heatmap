import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq } from 'drizzle-orm';
import { useDatabase } from '../contexts/DatabaseContext';
import { series } from '../db/schema';

/**
 * Live query hook for all series, ordered by creation date.
 */
export function useLiveSeries() {
  const db = useDatabase();
  const { data } = useLiveQuery(
    db.select().from(series).orderBy(desc(series.createdAt))
  );
  return { series: data ?? [], loading: data === undefined };
}

/**
 * Live query hook for the currently active series.
 */
export function useLiveActiveSeries() {
  const db = useDatabase();
  const { data } = useLiveQuery(
    db.select().from(series).where(eq(series.isActive, true)).limit(1)
  );
  return { activeSeries: data?.[0] ?? null, loading: data === undefined };
}
