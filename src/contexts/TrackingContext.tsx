import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useDatabase } from './DatabaseContext';
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
} from '../db/queries/series';
import { useLiveSeries, useLiveActiveSeries } from '../hooks/useLiveSeries';
import type { Series } from '../db/schema';

interface TrackingContextValue {
  isTracking: boolean;
  activeSeries: Series | null;
  allSeries: Array<Series>;
  startNewSeries: () => Promise<Series | null>;
  continueSeries: (seriesId: number) => Promise<boolean>;
  stopCurrentTracking: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const { settings } = useSettings();
  const [isTracking, setIsTracking] = useState(false);

  /** Use live queries for reactive data */
  const { series: allSeries } = useLiveSeries();
  const { activeSeries } = useLiveActiveSeries();

  /** Check tracking status on mount */
  useEffect(() => {
    const checkTracking = async () => {
      const tracking = await isTrackingActive();
      setIsTracking(tracking);
    };
    checkTracking();
  }, []);

  const startNewSeries = useCallback(async (): Promise<Series | null> => {
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

      const newSeries = createSeries(db, name, city, country);
      setActiveSeries(db, newSeries.seriesId);

      const started = await startTrackingService({
        timeInterval: settings.timeInterval,
        distanceInterval: settings.distanceInterval,
      });
      if (!started) {
        deactivateAllSeries(db);
        return null;
      }

      setIsTracking(true);
      return newSeries;
    } catch (error) {
      console.error('[TrackingContext] Failed to start new series:', error);
      return null;
    }
  }, [db, settings]);

  const continueSeries = useCallback(async (seriesId: number): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('[TrackingContext] Failed to continue series:', error);
      return false;
    }
  }, [db, settings]);

  const stopCurrentTracking = useCallback(async (): Promise<void> => {
    try {
      await stopTrackingService();
      deactivateAllSeries(db);
      setIsTracking(false);
    } catch (error) {
      console.error('[TrackingContext] Failed to stop tracking:', error);
    }
  }, [db]);

  const value: TrackingContextValue = {
    isTracking,
    activeSeries,
    allSeries,
    startNewSeries,
    continueSeries,
    stopCurrentTracking,
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
