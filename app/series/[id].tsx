import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useDatabaseReady } from '../../src/contexts/DatabaseContext';
import { useSeriesById } from '../../src/hooks/useSeries';
import { useHeatmapPoints, calculateRegion } from '../../src/hooks/useHeatmapPoints';
import { HeatmapOverlay } from '../../src/components/map/HeatmapOverlay';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isDbReady = useDatabaseReady();

  const seriesId = parseInt(id, 10);
  const { series, stats, loading, rename, remove } = useSeriesById(seriesId);
  const { points } = useHeatmapPoints([seriesId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (series?.name) {
      setEditName(series.name);
    }
  }, [series?.name]);

  const region = calculateRegion(points);

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      rename(editName.trim());
      setIsEditing(false);
    }
  }, [editName, rename]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Series',
      `Are you sure you want to delete "${series?.name}"? This will permanently remove all ${series?.point_count} location points.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove();
            router.back();
          },
        },
      ]
    );
  }, [series, remove, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isDbReady || loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!series) {
    return (
      <View style={styles.loading}>
        <Text>Series not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Series Details',
        }}
      />
      <ScrollView style={styles.container}>
        {/* Mini Map Preview */}
        <View style={styles.mapContainer}>
          {region ? (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <HeatmapOverlay points={points} />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>No location data</Text>
            </View>
          )}
        </View>

        {/* Series Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditName(series.name);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.value}>{series.name}</Text>
              <Text style={styles.hint}>Tap to edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {series.city && (
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {series.city}{series.country ? `, ${series.country}` : ''}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{series.point_count}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          {stats?.minTimestamp && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDate(stats.minTimestamp).split(',')[0]}
              </Text>
              <Text style={styles.statLabel}>Started</Text>
            </View>
          )}
          {stats?.maxTimestamp && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDate(stats.maxTimestamp).split(',')[0]}
              </Text>
              <Text style={styles.statLabel}>Last Updated</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{formatDate(series.created_at)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Last Updated</Text>
          <Text style={styles.value}>{formatDate(series.updated_at)}</Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Series</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
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
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#888888',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  hint: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4285F4',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  deleteButton: {
    margin: 16,
    marginTop: 32,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EA4335',
    fontSize: 16,
    fontWeight: '600',
  },
});
