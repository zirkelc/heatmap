import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../backgroundTask';

/**
 * Show a message and resolve with the button that the user pressed.
 */
function ask(title: string, message: string, cancel: string, confirm: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirm, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/**
 * Make sure that the app has the "When In Use" location permission.
 * Recording does not need "Always": updates that start in the foreground continue
 * in the background, and iOS shows the location indicator.
 * Before the first system prompt, the app explains what it records. If the user
 * declined before, the app offers to open the system settings.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) {
    return true;
  }

  if (current.canAskAgain) {
    const proceed = await ask(
      'Record Your Location',
      'While a recording runs, the app saves your location, also when it is in the background. Your recorded locations stay on this device.',
      'Not Now',
      'Continue'
    );
    if (!proceed) {
      return false;
    }
    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.granted;
  }

  const openSettings = await ask(
    'Location Access Is Off',
    'To record, allow location access in Settings.',
    'Cancel',
    'Open Settings'
  );
  if (openSettings) {
    await Linking.openSettings();
  }
  return false;
}

/**
 * True if the app has the location permission. Does not show a prompt.
 */
export async function hasLocationPermission(): Promise<boolean> {
  const { granted } = await Location.getForegroundPermissionsAsync();
  return granted;
}

/**
 * Check if location tracking is currently running.
 */
export async function isTrackingActive(): Promise<boolean> {
  return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
}

/**
 * Start background location tracking. The caller must make sure that the
 * location permission is granted.
 * iOS sends an update about every second, with GPS accuracy. The app selects the points to
 * save from these updates with the tracking settings, so that it also saves points while
 * the user stays at one place.
 */
export async function startTracking(): Promise<boolean> {
  if (await isTrackingActive()) {
    return true;
  }

  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      // In the background, send the updates in batches to wake the app less often
      deferredUpdatesInterval: 30_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Recording',
        notificationBody: 'Your location is recorded for the heatmap',
        notificationColor: '#4285F4',
      },
      pausesUpdatesAutomatically: false,
    });
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
  if (!(await isTrackingActive())) {
    return;
  }

  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch (error) {
    console.error('[Tracking] Failed to stop:', error);
  }
}

/**
 * Get the current location without a permission prompt.
 * Uses a recent known location first, because a new fix can take long indoors.
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  if (!(await hasLocationPermission())) {
    return null;
  }

  try {
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    if (lastKnown) {
      return lastKnown;
    }
    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch (error) {
    console.error('[Tracking] Failed to get current location:', error);
    return null;
  }
}
