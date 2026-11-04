/**
 * Opens a screen and starts a recording from launch arguments, so that screenshots
 * can be taken without taps:
 *   xcrun simctl launch <device> <bundle id> -demoRoute history -demoRecord 1
 * Only rendered in builds with EXPO_PUBLIC_SEED_DEMO=1.
 */
import { useEffect } from 'react';
import { Platform, Settings } from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '../contexts/DatabaseContext';
import { useTracking } from '../contexts/TrackingContext';
import { getAllSeries } from '../db/queries/series';

/** Time for the navigator to mount before the first navigation */
const NAVIGATION_DELAY_MS = 1_000;

export function DemoLauncher() {
  const router = useRouter();
  const db = useDatabase();
  const { continueSeries } = useTracking();

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const route = Settings.get('demoRoute') as string | undefined;
    const record = Settings.get('demoRecord') as string | undefined;
    const newest = getAllSeries(db)[0];

    const timer = setTimeout(async () => {
      if (record === '1' && newest) {
        await continueSeries(newest.seriesId);
      }
      if (route === 'history') {
        router.navigate('/history');
      } else if (route === 'settings') {
        router.navigate('/settings');
      } else if (route === 'series' && newest) {
        router.navigate('/history');
        router.push(`/series/${newest.seriesId}`);
      }
    }, NAVIGATION_DELAY_MS);

    return () => clearTimeout(timer);
    // Runs once at launch
  }, []);

  return null;
}
