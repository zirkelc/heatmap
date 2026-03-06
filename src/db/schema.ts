/**
 * Database schema for the heatmap location tracking app.
 */

export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    point_count INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS location_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL,
    accuracy REAL,
    timestamp TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_location_points_series_id ON location_points(series_id);`,
  `CREATE INDEX IF NOT EXISTS idx_series_is_active ON series(is_active);`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
];

export interface Series {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  is_active: number;
  point_count: number;
}

export interface LocationPoint {
  id: number;
  series_id: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: string;
  weight: number;
}
