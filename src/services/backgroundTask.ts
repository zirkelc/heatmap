/**
 * Background location task definition.
 * IMPORTANT: This file must be imported at the app root level for the task to work.
 */
import * as TaskManager from 'expo-task-manager';
import type * as Location from 'expo-location';
import { getDatabase } from '../db/client';
import { recordLocations } from '../db/queries/locations';

export const LOCATION_TASK_NAME = 'background-location-task';

/**
 * Define the background location task.
 * This must be called at module level (outside any component).
 */
TaskManager.defineTask<{ locations?: Array<Location.LocationObject> }>(
  LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.error('[BackgroundTask] Error:', error);
      return;
    }

    const locations = data?.locations ?? [];
    if (locations.length === 0) {
      return;
    }

    try {
      const result = recordLocations(
        getDatabase(),
        locations.map((location) => ({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        }))
      );

      if (!result) {
        console.warn('[BackgroundTask] No active series, location updates were not saved');
      }
    } catch (err) {
      console.error('[BackgroundTask] Failed to save locations:', err);
    }
  }
);
