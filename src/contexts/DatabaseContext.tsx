import React, { createContext, useContext, type ReactNode } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { getDatabase } from '../db/client';
import migrations from '../../drizzle/migrations';

type DrizzleDB = ReturnType<typeof getDatabase>;

interface DatabaseContextValue {
  db: DrizzleDB | null;
  isReady: boolean;
}

let demoDataChecked = false;

/**
 * Load demo data into an empty database when the build sets EXPO_PUBLIC_SEED_DEMO=1.
 * Used for screenshots and manual tests only.
 */
function seedDemoDataIfEnabled(db: DrizzleDB): void {
  if (process.env.EXPO_PUBLIC_SEED_DEMO !== '1' || demoDataChecked) {
    return;
  }
  demoDataChecked = true;
  const { seedDemoData } = require('../dev/demoData') as typeof import('../dev/demoData');
  seedDemoData(db);
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const db = getDatabase();
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  seedDemoDataIfEnabled(db);

  return (
    <DatabaseContext.Provider value={{ db, isReady: true }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DrizzleDB {
  const { db, isReady } = useContext(DatabaseContext);
  if (!isReady || !db) {
    throw new Error('Database not ready. Make sure DatabaseProvider is mounted.');
  }
  return db;
}

export function useDatabaseReady(): boolean {
  const { isReady } = useContext(DatabaseContext);
  return isReady;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    padding: 20,
  },
});
