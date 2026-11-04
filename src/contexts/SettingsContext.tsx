import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useDatabase } from './DatabaseContext';
import {
  getTrackingSettings,
  saveTrackingSettings,
  type TrackingSettings,
} from '../db/queries/settings';

interface SettingsContextValue {
  settings: TrackingSettings;
  updateSettings: (settings: TrackingSettings) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [settings, setSettings] = useState<TrackingSettings>(() => getTrackingSettings(db));

  const updateSettings = useCallback((newSettings: TrackingSettings) => {
    saveTrackingSettings(db, newSettings);
    setSettings(newSettings);
  }, [db]);

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    isLoaded: true,
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
