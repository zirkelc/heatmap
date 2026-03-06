import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../db/client';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const database = getDatabase();
    setDb(database);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): SQLiteDatabase {
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
