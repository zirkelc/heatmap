import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { inArray } from 'drizzle-orm';
import { useDatabase } from '../contexts/DatabaseContext';
import { locations } from '../db/schema';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

/**
 * Live heatmap points of the given series, or of all series.
 * Updates when location points are added or removed.
 */
export function useLiveHeatmap(seriesIds: Array<number> | 'all') {
  const db = useDatabase();
  const idsKey = seriesIds === 'all' ? 'all' : seriesIds.join(',');

  const { data, updatedAt } = useLiveQuery(
    db
      .select({
        latitude: locations.latitude,
        longitude: locations.longitude,
        weight: locations.weight,
      })
      .from(locations)
      .where(seriesIds === 'all' ? undefined : inArray(locations.seriesId, seriesIds)),
    [db, idsKey]
  );

  const points = useMemo<Array<HeatmapPoint>>(
    () => data.map((point) => ({ ...point, weight: point.weight ?? 1 })),
    [data]
  );

  return { points, loading: updatedAt === undefined, idsKey, updatedAt };
}
