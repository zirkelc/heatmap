import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from 'expo-router';
import { useDatabaseReady } from '../../src/contexts/DatabaseContext';
import { useTracking } from '../../src/contexts/TrackingContext';
import { useHeatmapPoints, calculateRegion } from '../../src/hooks/useHeatmapPoints';
import { HeatmapOverlay } from '../../src/components/map/HeatmapOverlay';
import { TrackingButton } from '../../src/components/tracking/TrackingButton';
import { SeriesPrompt } from '../../src/components/tracking/SeriesPrompt';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const isDbReady = useDatabaseReady();
  const mapRef = useRef<MapView>(null);

  const {
    isTracking,
    activeSeries,
    allSeries,
    startNewSeries,
    continueSeries,
    stopCurrentTracking,
    refreshSeries,
  } = useTracking();

  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Array<number>>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Update selected series when active series changes */
  useEffect(() => {
    if (activeSeries) {
      setSelectedSeriesIds([activeSeries.id]);
    }
  }, [activeSeries]);

  /** Refresh data when screen is focused */
  useFocusEffect(
    useCallback(() => {
      refreshSeries();
    }, [refreshSeries])
  );

  const { points, refresh: refreshPoints } = useHeatmapPoints(
    selectedSeriesIds.length > 0 ? selectedSeriesIds : 'all'
  );

  /** Refresh points when screen is focused */
  useFocusEffect(
    useCallback(() => {
      refreshPoints();
    }, [refreshPoints])
  );

  /** Refresh points periodically while tracking */
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      refreshPoints();
    }, 5_000);

    return () => clearInterval(interval);
  }, [isTracking, refreshPoints]);

  /** Center map on heatmap points */
  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      const region = calculateRegion(points);
      if (region) {
        mapRef.current.animateToRegion(region, 500);
      }
    }
  }, [points]);

  const handleTrackingPress = useCallback(() => {
    if (isTracking) {
      Alert.alert(
        'Stop Tracking',
        'Are you sure you want to stop tracking?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              await stopCurrentTracking();
              refreshPoints();
              setIsLoading(false);
            },
          },
        ]
      );
    } else {
      setShowPrompt(true);
    }
  }, [isTracking, stopCurrentTracking, refreshPoints]);

  const handleStartNew = useCallback(async () => {
    setShowPrompt(false);
    setIsLoading(true);

    const series = await startNewSeries();
    if (!series) {
      Alert.alert('Error', 'Failed to start tracking. Please check location permissions.');
    }

    setIsLoading(false);
  }, [startNewSeries]);

  const handleContinue = useCallback(async (seriesId: number) => {
    setShowPrompt(false);
    setIsLoading(true);

    const success = await continueSeries(seriesId);
    if (!success) {
      Alert.alert('Error', 'Failed to continue tracking. Please check location permissions.');
    }

    setIsLoading(false);
  }, [continueSeries]);

  const handleSeriesFilter = useCallback(() => {
    if (allSeries.length === 0) {
      Alert.alert('No Series', 'Start tracking to create your first series.');
      return;
    }

    const options = [
      { text: 'Show All', onPress: () => setSelectedSeriesIds([]) },
      ...allSeries.slice(0, 5).map((s) => ({
        text: s.name,
        onPress: () => setSelectedSeriesIds([s.id]),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Filter Series', 'Select which series to display', options);
  }, [allSeries]);

  if (!isDbReady) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        <HeatmapOverlay points={points} />
      </MapView>

      {/* Series Filter Chip */}
      <TouchableOpacity style={styles.filterChip} onPress={handleSeriesFilter}>
        <Text style={styles.filterText}>
          {selectedSeriesIds.length === 0
            ? 'All Series'
            : selectedSeriesIds.length === 1
            ? allSeries.find((s) => s.id === selectedSeriesIds[0])?.name ?? 'Series'
            : `${selectedSeriesIds.length} Series`}
        </Text>
      </TouchableOpacity>

      {/* Tracking Status */}
      {isTracking && activeSeries && (
        <View style={styles.statusBar}>
          <View style={styles.recordingDot} />
          <Text style={styles.statusText} numberOfLines={1}>
            Recording: {activeSeries.name}
          </Text>
        </View>
      )}

      <TrackingButton
        isTracking={isTracking}
        isLoading={isLoading}
        onPress={handleTrackingPress}
      />

      <SeriesPrompt
        visible={showPrompt}
        series={allSeries}
        onStartNew={handleStartNew}
        onContinue={handleContinue}
        onClose={() => setShowPrompt(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChip: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  statusBar: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(234, 67, 53, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
