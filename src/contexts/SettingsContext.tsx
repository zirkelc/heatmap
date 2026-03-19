import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useDatabaseReady } from './DatabaseContext';
import {
  getTrackingSettings,
  saveTrackingSettings,
  DEFAULT_SETTINGS,
  type TrackingSettings,
} from '../db/queries/settings';
import type { getDatabase } from '../db/client';

type DrizzleDB = ReturnType<typeof getDatabase>;

interface SettingsContextValue {
  settings: TrackingSettings;
  updateSettings: (settings: TrackingSettings) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const isDbReady = useDatabaseReady();
  const [db, setDb] = useState<DrizzleDB | null>(null);
  const [settings, setSettings] = useState<TrackingSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

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

  /** Load settings from database */
  useEffect(() => {
    if (!db) return;

    const loadedSettings = getTrackingSettings(db);
    setSettings(loadedSettings);
    setIsLoaded(true);
  }, [db]);

  const updateSettings = useCallback((newSettings: TrackingSettings) => {
    if (!db) return;

    saveTrackingSettings(db, newSettings);
    setSettings(newSettings);
  }, [db]);

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    isLoaded,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
