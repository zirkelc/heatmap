import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

/**
 * Series table - represents a collection of tracked location points.
 */
export const series = sqliteTable('series', {
  seriesId: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  city: text(),
  country: text(),
  createdAt: text()
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: text()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString())
    .notNull(),
  isActive: integer({ mode: 'boolean' }).default(false),
  pointCount: integer().default(0),
});

/**
 * Locations table - stores individual GPS coordinates (renamed from location_points).
 */
export const locations = sqliteTable(
  'locations',
  {
    locationId: integer().primaryKey({ autoIncrement: true }),
    seriesId: integer()
      .notNull()
      .references(() => series.seriesId, { onDelete: 'cascade' }),
    latitude: real().notNull(),
    longitude: real().notNull(),
    altitude: real(),
    accuracy: real(),
    timestamp: text().notNull(),
    weight: real().default(1.0),
  },
  (table) => [index('idx_locations_seriesId').on(table.seriesId)]
);

/**
 * Settings table - key-value store for app configuration.
 */
export const settings = sqliteTable('settings', {
  key: text().primaryKey(),
  value: text().notNull(),
});

/** Inferred types for Series */
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;

/** Inferred types for Location */
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

/** Inferred types for Settings */
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
