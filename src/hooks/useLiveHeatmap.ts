import { useMemo } from 'react';
import { useLiveAllLocations } from './useLiveLocations';
import type { HeatmapPoint } from './useHeatmapPoints';

/**
 * Live query hook for heatmap points with filtering by series IDs.
 */
export function useLiveHeatmap(selectedSeriesIds: Array<number> | 'all') {
  const { locations, loading } = useLiveAllLocations();

  const points = useMemo<Array<HeatmapPoint>>(() => {
    const filtered = selectedSeriesIds === 'all'
      ? locations
      : locations.filter(loc => selectedSeriesIds.includes(loc.seriesId));

    return filtered.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      weight: loc.weight ?? 1.0,
    }));
  }, [locations, selectedSeriesIds]);

  return { points, loading };
}
