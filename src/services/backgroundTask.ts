/**
 * Background location task definition.
 * IMPORTANT: This file must be imported at the app root level for the task to work.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { eq } from 'drizzle-orm';
import { getDatabaseSync } from '../db/client';
import { series } from '../db/schema';
import { insertLocation } from '../db/queries/locations';
import { updateSeriesPointCount } from '../db/queries/series';

export const LOCATION_TASK_NAME = 'background-location-task';

/**
 * Define the background location task.
 * This must be called at module level (outside any component).
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Error:', error);
    return;
  }

  if (!data) {
    console.warn('[BackgroundTask] No data received');
    return;
  }

  const { locations } = data as { locations: Array<Location.LocationObject> };

  if (!locations || locations.length === 0) {
    console.warn('[BackgroundTask] No locations in data');
    return;
  }

  try {
    const db = getDatabaseSync();

    /** Get the active series */
    const activeSeries = db
      .select({ seriesId: series.seriesId })
      .from(series)
      .where(eq(series.isActive, true))
      .get();

    if (!activeSeries) {
      console.warn('[BackgroundTask] No active series found');
      return;
    }

    /** Insert all locations */
    for (const location of locations) {
      insertLocation(
        db,
        activeSeries.seriesId,
        location.coords.latitude,
        location.coords.longitude,
        location.coords.altitude,
        location.coords.accuracy,
        new Date(location.timestamp).toISOString()
      );
    }

    /** Update point count */
    updateSeriesPointCount(db, activeSeries.seriesId);

    console.log(`[BackgroundTask] Saved ${locations.length} locations to series ${activeSeries.seriesId}`);
  } catch (err) {
    console.error('[BackgroundTask] Failed to save locations:', err);
  }
});
