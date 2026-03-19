import { useState, useCallback, useEffect, useRef } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { getLocationsBySeriesIds, getAllLocations } from '../db/queries/locations';
import type { Location } from '../db/schema';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

/**
 * Hook for getting heatmap points from selected series.
 */
export function useHeatmapPoints(selectedSeriesIds: Array<number> | 'all') {
  const db = useDatabase();
  const [points, setPoints] = useState<Array<HeatmapPoint>>([]);
  const [loading, setLoading] = useState(true);

  /** Stabilize array reference by comparing contents */
  const idsKey = selectedSeriesIds === 'all' ? 'all' : selectedSeriesIds.join(',');
  const idsRef = useRef(selectedSeriesIds);
  idsRef.current = selectedSeriesIds;

  const refresh = useCallback(() => {
    setLoading(true);

    let locations: Array<Location>;

    if (idsRef.current === 'all') {
      locations = getAllLocations(db);
    } else {
      locations = getLocationsBySeriesIds(db, idsRef.current);
    }

    const heatmapPoints: Array<HeatmapPoint> = locations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      weight: loc.weight ?? 1.0,
    }));

    setPoints(heatmapPoints);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [idsKey, refresh]);

  return {
    points,
    loading,
    refresh,
  };
}

/**
 * Calculate the center and zoom for a set of points.
 */
export function calculateRegion(points: Array<HeatmapPoint>): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null {
  if (points.length === 0) {
    return null;
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDelta = Math.max((maxLat - minLat) * 1.2, 0.01);
  const lngDelta = Math.max((maxLng - minLng) * 1.2, 0.01);

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}
