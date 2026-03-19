import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useDatabaseReady } from './DatabaseContext';
import { useSettings } from './SettingsContext';
import {
  startTracking as startTrackingService,
  stopTracking as stopTrackingService,
  isTrackingActive,
  getCurrentLocation,
} from '../services/location/tracking';
import { generateSeriesName } from '../services/location/geocoding';
import {
  createSeries,
  setActiveSeries,
  deactivateAllSeries,
  getActiveSeries,
  getAllSeries,
} from '../db/queries/series';
import type { Series } from '../db/schema';
import type { getDatabase } from '../db/client';

type DrizzleDB = ReturnType<typeof getDatabase>;

interface TrackingContextValue {
  isTracking: boolean;
  activeSeries: Series | null;
  allSeries: Array<Series>;
  startNewSeries: () => Promise<Series | null>;
  continueSeries: (seriesId: number) => Promise<boolean>;
  stopCurrentTracking: () => Promise<void>;
  refreshSeries: () => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const isDbReady = useDatabaseReady();
  const { settings } = useSettings();
  const [db, setDb] = useState<DrizzleDB | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [activeSeries, setActiveSeriesState] = useState<Series | null>(null);
  const [allSeries, setAllSeries] = useState<Array<Series>>([]);

  /** Get database when ready */
  useEffect(() => {
    if (isDbReady) {
      try {
        const { getDatabase } = require('../db/client');
        setDb(getDatabase());
      } catch (e) {
        console.error('Failed to get database:', e);
      }
    }
  }, [isDbReady]);

  /** Check tracking status and load series on mount */
  useEffect(() => {
    if (!db) return;

    const init = async () => {
      const tracking = await isTrackingActive();
      setIsTracking(tracking);

      const active = getActiveSeries(db);
      setActiveSeriesState(active ?? null);

      const series = getAllSeries(db);
      setAllSeries(series);
    };

    init();
  }, [db]);

  const refreshSeries = useCallback(() => {
    if (!db) return;
    const series = getAllSeries(db);
    setAllSeries(series);
    const active = getActiveSeries(db);
    setActiveSeriesState(active ?? null);
  }, [db]);

  const startNewSeries = useCallback(async (): Promise<Series | null> => {
    if (!db) return null;

    try {
      const location = await getCurrentLocation();
      let name = `Tracking - ${new Date().toLocaleDateString()}`;
      let city: string | null = null;
      let country: string | null = null;

      if (location) {
        const generated = await generateSeriesName(
          location.coords.latitude,
          location.coords.longitude
        );
        name = generated.name;
        city = generated.city;
        country = generated.country;
      }

      const series = createSeries(db, name, city, country);
      setActiveSeries(db, series.seriesId);

      const started = await startTrackingService({
        timeInterval: settings.timeInterval,
        distanceInterval: settings.distanceInterval,
      });
      if (!started) {
        deactivateAllSeries(db);
        return null;
      }

      setIsTracking(true);
      setActiveSeriesState(series);
      refreshSeries();

      return series;
    } catch (error) {
      console.error('[TrackingContext] Failed to start new series:', error);
      return null;
    }
  }, [db, refreshSeries, settings]);

  const continueSeries = useCallback(async (seriesId: number): Promise<boolean> => {
    if (!db) return false;

    try {
      setActiveSeries(db, seriesId);

      const started = await startTrackingService({
        timeInterval: settings.timeInterval,
        distanceInterval: settings.distanceInterval,
      });
      if (!started) {
        deactivateAllSeries(db);
        return false;
      }

      setIsTracking(true);
      const active = getActiveSeries(db);
      setActiveSeriesState(active ?? null);
      refreshSeries();

      return true;
    } catch (error) {
      console.error('[TrackingContext] Failed to continue series:', error);
      return false;
    }
  }, [db, refreshSeries, settings]);

  const stopCurrentTracking = useCallback(async (): Promise<void> => {
    if (!db) return;

    try {
      await stopTrackingService();
      deactivateAllSeries(db);
      setIsTracking(false);
      setActiveSeriesState(null);
      refreshSeries();
    } catch (error) {
      console.error('[TrackingContext] Failed to stop tracking:', error);
    }
  }, [db, refreshSeries]);

  const value: TrackingContextValue = {
    isTracking,
    activeSeries,
    allSeries,
    startNewSeries,
    continueSeries,
    stopCurrentTracking,
    refreshSeries,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within TrackingProvider');
  }
  return context;
}
