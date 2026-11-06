import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useDatabase } from './DatabaseContext';
import {
  ensureLocationPermission,
  startTracking as startTrackingService,
  stopTracking as stopTrackingService,
  isTrackingActive,
  getCurrentLocation,
} from '../services/location/tracking';
import { generateSeriesName } from '../services/location/geocoding';
import {
  createSeries,
  deleteSeries,
  getActiveSeries,
  setActiveSeries,
  deactivateAllSeries,
} from '../db/queries/series';
import { useLiveSeries, useLiveActiveSeries } from '../hooks/useLiveSeries';
import { getTrackingRepair } from '../lib/tracking';
import type { Series } from '../db/schema';

/**
 * Result of a start request. 'permission-denied' needs no further message,
 * because the permission flow already told the user what to do.
 */
export type StartResult = 'started' | 'permission-denied' | 'failed';

interface TrackingContextValue {
  isTracking: boolean;
  activeSeries: Series | null;
  /** The series that receives new points, or null when nothing records */
  recordingSeriesId: number | null;
  allSeries: Array<Series>;
  startNewSeries: () => Promise<StartResult>;
  continueSeries: (seriesId: number) => Promise<StartResult>;
  stopCurrentTracking: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [isTracking, setIsTracking] = useState(false);

  /** Use live queries for reactive data */
  const { series: allSeries } = useLiveSeries();
  const { activeSeries } = useLiveActiveSeries();

  /** Make the database agree with the OS: on launch and each time the app comes back */
  const syncTrackingState = useCallback(async () => {
    try {
      const isOsTracking = await isTrackingActive();
      const repair = getTrackingRepair({
        isOsTracking,
        hasActiveSeries: getActiveSeries(db) !== undefined,
      });

      if (repair === 'deactivate-series') {
        deactivateAllSeries(db);
      } else if (repair === 'stop-updates') {
        await stopTrackingService();
      }

      setIsTracking(isOsTracking && repair === 'none');
    } catch (error) {
      console.error('[TrackingContext] Failed to sync tracking state:', error);
    }
  }, [db]);

  useEffect(() => {
    syncTrackingState();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncTrackingState();
      }
    });
    return () => subscription.remove();
  }, [syncTrackingState]);

  const startNewSeries = useCallback(async (): Promise<StartResult> => {
    if (!(await ensureLocationPermission())) {
      return 'permission-denied';
    }

    let newSeries: Series | null = null;
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

      newSeries = createSeries(db, name, city, country);
      setActiveSeries(db, newSeries.seriesId);

      const started = await startTrackingService();
      if (!started) {
        // Do not keep an empty series for a recording that never started
        deleteSeries(db, newSeries.seriesId);
        return 'failed';
      }

      setIsTracking(true);
      return 'started';
    } catch (error) {
      console.error('[TrackingContext] Failed to start new series:', error);
      if (newSeries) {
        deleteSeries(db, newSeries.seriesId);
      }
      return 'failed';
    }
  }, [db]);

  const continueSeries = useCallback(async (seriesId: number): Promise<StartResult> => {
    if (!(await ensureLocationPermission())) {
      return 'permission-denied';
    }

    try {
      setActiveSeries(db, seriesId);

      const started = await startTrackingService();
      if (!started) {
        deactivateAllSeries(db);
        return 'failed';
      }

      setIsTracking(true);
      return 'started';
    } catch (error) {
      console.error('[TrackingContext] Failed to continue series:', error);
      deactivateAllSeries(db);
      return 'failed';
    }
  }, [db]);

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
    recordingSeriesId: isTracking && activeSeries ? activeSeries.seriesId : null,
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
