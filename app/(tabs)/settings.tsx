import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useSettings } from '../../src/contexts/SettingsContext';
import {
  DISTANCE_INTERVAL_OPTIONS,
  TIME_INTERVAL_OPTIONS,
  nearestOptionIndex,
} from '../../src/db/queries/settings';

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1_000);
  if (seconds < 60) {
    return `${seconds} s`;
  }
  return `${Math.round(seconds / 60)} min`;
}

function formatDistance(meters: number): string {
  return `${meters} m`;
}

export default function SettingsScreen() {
  const { settings, updateSettings, isLoaded } = useSettings();
  // The sliders select an index in the list of options
  const [timeIndex, setTimeIndex] = useState(() => nearestOptionIndex(TIME_INTERVAL_OPTIONS, settings.timeInterval));
  const [distanceIndex, setDistanceIndex] = useState(() =>
    nearestOptionIndex(DISTANCE_INTERVAL_OPTIONS, settings.distanceInterval)
  );

  useEffect(() => {
    if (isLoaded) {
      setTimeIndex(nearestOptionIndex(TIME_INTERVAL_OPTIONS, settings.timeInterval));
      setDistanceIndex(nearestOptionIndex(DISTANCE_INTERVAL_OPTIONS, settings.distanceInterval));
    }
  }, [isLoaded, settings]);

  const handleTimeSlidingComplete = (value: number) => {
    updateSettings({ ...settings, timeInterval: TIME_INTERVAL_OPTIONS[Math.round(value)] });
  };

  const handleDistanceSlidingComplete = (value: number) => {
    updateSettings({ ...settings, distanceInterval: DISTANCE_INTERVAL_OPTIONS[Math.round(value)] });
  };

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }} collapsable={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Tracking</Text>
            <Text style={styles.sectionDescription}>
              Set how often the app saves your location during a recording.
            </Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Time Interval</Text>
              <Text style={styles.settingValue}>{formatTime(TIME_INTERVAL_OPTIONS[timeIndex])}</Text>
            </View>
            <Text style={styles.settingDescription}>
              Save a point at least this often, also when you stay at one place
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={TIME_INTERVAL_OPTIONS.length - 1}
              step={1}
              value={timeIndex}
              onValueChange={(value) => setTimeIndex(Math.round(value))}
              onSlidingComplete={handleTimeSlidingComplete}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#4285F4"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{formatTime(TIME_INTERVAL_OPTIONS[0])}</Text>
              <Text style={styles.sliderLabel}>{formatTime(TIME_INTERVAL_OPTIONS[TIME_INTERVAL_OPTIONS.length - 1])}</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Distance Interval</Text>
              <Text style={styles.settingValue}>{formatDistance(DISTANCE_INTERVAL_OPTIONS[distanceIndex])}</Text>
            </View>
            <Text style={styles.settingDescription}>
              Save a point each time you move this distance
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={DISTANCE_INTERVAL_OPTIONS.length - 1}
              step={1}
              value={distanceIndex}
              onValueChange={(value) => setDistanceIndex(Math.round(value))}
              onSlidingComplete={handleDistanceSlidingComplete}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#4285F4"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{formatDistance(DISTANCE_INTERVAL_OPTIONS[0])}</Text>
              <Text style={styles.sliderLabel}>
                {formatDistance(DISTANCE_INTERVAL_OPTIONS[DISTANCE_INTERVAL_OPTIONS.length - 1])}
              </Text>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              Changes apply at once, also to a recording that runs. Lower values give a more detailed map and a bigger database. During a recording, the app uses GPS, which uses more battery.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888888',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4285F4',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#888888',
  },
  noteCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
  },
});
