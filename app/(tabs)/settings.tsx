import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useSettings } from '../../src/contexts/SettingsContext';

export default function SettingsScreen() {
  const { settings, updateSettings, isLoaded } = useSettings();
  const [timeInterval, setTimeInterval] = useState(settings.timeInterval);
  const [distanceInterval, setDistanceInterval] = useState(settings.distanceInterval);

  useEffect(() => {
    if (isLoaded) {
      setTimeInterval(settings.timeInterval);
      setDistanceInterval(settings.distanceInterval);
    }
  }, [isLoaded, settings]);

  const handleTimeChange = (value: number) => {
    const rounded = Math.round(value / 10_000) * 10_000;
    setTimeInterval(rounded);
  };

  const handleTimeSlidingComplete = (value: number) => {
    const rounded = Math.round(value / 10_000) * 10_000;
    updateSettings({ ...settings, timeInterval: rounded });
  };

  const handleDistanceChange = (value: number) => {
    const rounded = Math.round(value / 10) * 10;
    setDistanceInterval(rounded);
  };

  const handleDistanceSlidingComplete = (value: number) => {
    const rounded = Math.round(value / 10) * 10;
    updateSettings({ ...settings, distanceInterval: rounded });
  };

  const formatTime = (ms: number) => {
    const rounded = Math.round(ms / 10_000) * 10_000;
    const seconds = Math.round(rounded / 1_000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.round(seconds / 60);
    if (seconds % 60 === 0) {
      return `${minutes}min`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatDistance = (meters: number) => {
    const rounded = Math.round(meters / 10) * 10;
    return `${rounded}m`;
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
              Configure how often location updates are recorded during background tracking.
            </Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Time Interval</Text>
              <Text style={styles.settingValue}>{formatTime(timeInterval)}</Text>
            </View>
            <Text style={styles.settingDescription}>
              Minimum time between location updates
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={10_000}
              maximumValue={300_000}
              step={10_000}
              value={timeInterval}
              onValueChange={handleTimeChange}
              onSlidingComplete={handleTimeSlidingComplete}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#4285F4"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>10s</Text>
              <Text style={styles.sliderLabel}>5min</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Distance Interval</Text>
              <Text style={styles.settingValue}>{formatDistance(distanceInterval)}</Text>
            </View>
            <Text style={styles.settingDescription}>
              Minimum distance traveled before recording a new location
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={500}
              step={10}
              value={distanceInterval}
              onValueChange={handleDistanceChange}
              onSlidingComplete={handleDistanceSlidingComplete}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#4285F4"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>10m</Text>
              <Text style={styles.sliderLabel}>500m</Text>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              Changes will apply to new tracking sessions. Lower values provide more accurate tracking but may increase battery usage.
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
