import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../backgroundTask';

/**
 * Request location permissions (foreground and background).
 */
export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  const foreground = foregroundStatus === 'granted';

  if (!foreground) {
    return { foreground: false, background: false };
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  const background = backgroundStatus === 'granted';

  return { foreground, background };
}

/**
 * Check if location tracking is currently running.
 */
export async function isTrackingActive(): Promise<boolean> {
  return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
}

export interface TrackingOptions {
  timeInterval?: number;
  distanceInterval?: number;
}

const DEFAULT_TIME_INTERVAL = 60_000;
const DEFAULT_DISTANCE_INTERVAL = 50;

/**
 * Start background location tracking.
 */
export async function startTracking(options?: TrackingOptions): Promise<boolean> {
  const permissions = await requestLocationPermissions();

  if (!permissions.foreground || !permissions.background) {
    console.error('[Tracking] Missing permissions:', permissions);
    return false;
  }

  const isStarted = await isTrackingActive();
  if (isStarted) {
    console.log('[Tracking] Already tracking');
    return true;
  }

  const timeInterval = options?.timeInterval ?? DEFAULT_TIME_INTERVAL;
  const distanceInterval = options?.distanceInterval ?? DEFAULT_DISTANCE_INTERVAL;

  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval,
      distanceInterval,
      deferredUpdatesInterval: timeInterval,
      deferredUpdatesDistance: distanceInterval,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Heatmap Tracking',
        notificationBody: 'Recording your location for the heatmap',
        notificationColor: '#4285F4',
      },
      pausesUpdatesAutomatically: false,
    });

    console.log('[Tracking] Started with intervals:', { timeInterval, distanceInterval });
    return true;
  } catch (error) {
    console.error('[Tracking] Failed to start:', error);
    return false;
  }
}

/**
 * Stop background location tracking.
 */
export async function stopTracking(): Promise<void> {
  const isStarted = await isTrackingActive();

  if (!isStarted) {
    console.log('[Tracking] Not currently tracking');
    return;
  }

  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[Tracking] Stopped');
  } catch (error) {
    console.error('[Tracking] Failed to stop:', error);
  }
}

/**
 * Get the current location (one-time).
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    return null;
  }

  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    console.error('[Tracking] Failed to get current location:', error);
    return null;
  }
}
