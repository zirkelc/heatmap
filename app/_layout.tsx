import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '../src/contexts/DatabaseContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { TrackingProvider } from '../src/contexts/TrackingContext';
import { DemoLauncher } from '../src/dev/DemoLauncher';

/** Import background task to register it globally */
import '../src/services/backgroundTask';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <SettingsProvider>
        <TrackingProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="series/[id]"
              options={{
                headerShown: true,
                title: 'Series Details',
                presentation: 'card',
                headerBackTitle: 'History',
              }}
            />
          </Stack>
          {process.env.EXPO_PUBLIC_SEED_DEMO === '1' && <DemoLauncher />}
        </TrackingProvider>
      </SettingsProvider>
    </DatabaseProvider>
  );
}
