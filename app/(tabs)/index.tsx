import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracking } from '../../src/contexts/TrackingContext';
import { useLiveHeatmap } from '../../src/hooks/useLiveHeatmap';
import { calculateRegion } from '../../src/lib/region';
import { getCurrentLocation } from '../../src/services/location/tracking';
import { HeatmapOverlay } from '../../src/components/map/HeatmapOverlay';
import { SeriesFilterSheet } from '../../src/components/map/SeriesFilterSheet';
import { TrackingButton } from '../../src/components/tracking/TrackingButton';
import { SeriesPrompt } from '../../src/components/tracking/SeriesPrompt';

/** Wide start region, used until the app knows the data or the user's location */
const DEFAULT_REGION = {
  latitude: 30,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

const USER_REGION_DELTA = 0.02;

/** Height of the native tab bar above the bottom safe area */
const TAB_BAR_HEIGHT = 49;

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const {
    isTracking,
    activeSeries,
    allSeries,
    startNewSeries,
    continueSeries,
    stopCurrentTracking,
  } = useTracking();

  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Array<number>>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Show the series that records */
  useEffect(() => {
    if (activeSeries) {
      setSelectedSeriesIds([activeSeries.seriesId]);
    }
  }, [activeSeries?.seriesId]);

  /** Use live heatmap - auto-updates when database changes */
  const { points, idsKey, updatedAt } = useLiveHeatmap(
    selectedSeriesIds.length > 0 ? selectedSeriesIds : 'all'
  );

  /**
   * Fit the map to the points once after each filter change, when the data for the
   * new filter arrives. New points during a recording do not move the map.
   */
  const fitRequest = useRef<{ after: Date | undefined } | null>(null);
  useEffect(() => {
    fitRequest.current = { after: updatedAt };
  }, [idsKey]);

  useEffect(() => {
    const request = fitRequest.current;
    if (!request || request.after === updatedAt) {
      return;
    }
    fitRequest.current = null;

    const region = calculateRegion(points);
    if (region) {
      mapRef.current?.animateToRegion(region, 500);
      return;
    }

    // No data for this filter: show the user's location if the app may read it
    getCurrentLocation().then((location) => {
      if (location) {
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: USER_REGION_DELTA,
            longitudeDelta: USER_REGION_DELTA,
          },
          500
        );
      }
    });
  }, [updatedAt, points]);

  const handleTrackingPress = useCallback(() => {
    if (isTracking) {
      Alert.alert(
        'Stop Recording',
        'Do you want to stop the recording?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              await stopCurrentTracking();
              setIsLoading(false);
            },
          },
        ]
      );
    } else {
      setShowPrompt(true);
    }
  }, [isTracking, stopCurrentTracking]);

  const handleStartNew = useCallback(async () => {
    setShowPrompt(false);
    setIsLoading(true);

    const result = await startNewSeries();
    if (result === 'failed') {
      Alert.alert('Could Not Start Recording', 'Please try again.');
    }

    setIsLoading(false);
  }, [startNewSeries]);

  const handleContinue = useCallback(async (seriesId: number) => {
    setShowPrompt(false);
    setIsLoading(true);

    const result = await continueSeries(seriesId);
    if (result === 'failed') {
      Alert.alert('Could Not Start Recording', 'Please try again.');
    }

    setIsLoading(false);
  }, [continueSeries]);

  const handleSeriesFilter = useCallback(() => {
    if (allSeries.length === 0) {
      Alert.alert('No Series', 'Start a recording to create your first series.');
      return;
    }
    setShowFilter(true);
  }, [allSeries]);

  const handleFilterSelect = useCallback((seriesIds: Array<number>) => {
    setSelectedSeriesIds(seriesIds);
    setShowFilter(false);
  }, []);

  const filterLabel =
    selectedSeriesIds.length === 0
      ? 'All Series'
      : selectedSeriesIds.length === 1
        ? allSeries.find((s) => s.seriesId === selectedSeriesIds[0])?.name ?? 'Series'
        : `${selectedSeriesIds.length} Series`;

  return (
    <View style={styles.container} collapsable={false}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
        mapPadding={{ top: insets.top, right: 0, bottom: insets.bottom + TAB_BAR_HEIGHT, left: 0 }}
      >
        <HeatmapOverlay points={points} />
      </MapView>

      {/* Keeps the status bar readable over the map */}
      <View style={[styles.statusBarBackdrop, { height: insets.top }]} pointerEvents="none" />

      <View style={[styles.topOverlay, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.filterChip} onPress={handleSeriesFilter}>
          <Text style={styles.filterText} numberOfLines={1}>
            {filterLabel} ▾
          </Text>
        </TouchableOpacity>

        {isTracking && activeSeries && (
          <View style={styles.statusBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.statusText} numberOfLines={1}>
              Recording: {activeSeries.name}
            </Text>
          </View>
        )}
      </View>

      <TrackingButton
        isTracking={isTracking}
        isLoading={isLoading}
        onPress={handleTrackingPress}
        bottom={insets.bottom + TAB_BAR_HEIGHT + 16}
      />

      <SeriesPrompt
        visible={showPrompt}
        series={allSeries}
        onStartNew={handleStartNew}
        onContinue={handleContinue}
        onClose={() => setShowPrompt(false)}
      />

      <SeriesFilterSheet
        visible={showFilter}
        series={allSeries}
        selectedIds={selectedSeriesIds}
        onSelect={handleFilterSelect}
        onClose={() => setShowFilter(false)}
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
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '100%',
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
    backgroundColor: 'rgba(234, 67, 53, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
