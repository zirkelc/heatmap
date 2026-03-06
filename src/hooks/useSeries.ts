import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import {
  getAllSeries,
  getSeriesById,
  updateSeriesName,
  deleteSeries,
  mergeSeries,
} from '../db/queries/series';
import { getLocationStats } from '../db/queries/locations';
import type { Series } from '../db/schema';

/**
 * Hook for managing series data.
 */
export function useSeries() {
  const db = useDatabase();
  const [series, setSeries] = useState<Array<Series>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const data = getAllSeries(db);
    setSeries(data);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rename = useCallback((id: number, name: string) => {
    updateSeriesName(db, id, name);
    refresh();
  }, [db, refresh]);

  const remove = useCallback((id: number) => {
    deleteSeries(db, id);
    refresh();
  }, [db, refresh]);

  const merge = useCallback((targetId: number, sourceIds: Array<number>) => {
    mergeSeries(db, targetId, sourceIds);
    refresh();
  }, [db, refresh]);

  return {
    series,
    loading,
    refresh,
    rename,
    remove,
    merge,
  };
}

/**
 * Hook for getting a single series by ID.
 */
export function useSeriesById(id: number) {
  const db = useDatabase();
  const [series, setSeries] = useState<Series | null>(null);
  const [stats, setStats] = useState<{
    count: number;
    minTimestamp: string | null;
    maxTimestamp: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const data = getSeriesById(db, id);
    setSeries(data);
    if (data) {
      const locationStats = getLocationStats(db, id);
      setStats(locationStats);
    }
    setLoading(false);
  }, [db, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rename = useCallback((name: string) => {
    updateSeriesName(db, id, name);
    refresh();
  }, [db, id, refresh]);

  const remove = useCallback(() => {
    deleteSeries(db, id);
  }, [db, id]);

  return {
    series,
    stats,
    loading,
    refresh,
    rename,
    remove,
  };
}
