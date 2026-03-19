import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { asc } from 'drizzle-orm';
import { useDatabase } from '../contexts/DatabaseContext';
import { locations } from '../db/schema';

/**
 * Live query hook for all locations, ordered by timestamp.
 */
export function useLiveAllLocations() {
  const db = useDatabase();
  const { data } = useLiveQuery(
    db.select().from(locations).orderBy(asc(locations.timestamp))
  );
  return { locations: data ?? [], loading: data === undefined };
}
