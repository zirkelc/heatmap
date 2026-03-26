import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDatabase, useDatabaseReady } from '../../src/contexts/DatabaseContext';
import { useTracking } from '../../src/contexts/TrackingContext';
import { useLiveSeries } from '../../src/hooks/useLiveSeries';
import { updateSeriesName, deleteSeries, mergeSeries } from '../../src/db/queries/series';
import type { Series } from '../../src/db/schema';

export default function HistoryScreen() {
  const router = useRouter();
  const isDbReady = useDatabaseReady();
  const db = useDatabase();
  const { continueSeries, isTracking } = useTracking();
  const { series } = useLiveSeries();
  const insets = useSafeAreaInsets();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [newName, setNewName] = useState('');

  /** Multi-select state */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleContinue = useCallback(async (item: Series) => {
    if (isTracking) {
      Alert.alert('Already Tracking', 'Stop current tracking first to continue another series.');
      return;
    }

    const success = await continueSeries(item.seriesId);
    if (success) {
      router.navigate('/(tabs)');
    } else {
      Alert.alert('Error', 'Failed to start tracking. Please check location permissions.');
    }
  }, [continueSeries, isTracking, router]);

  const handleRename = useCallback((item: Series) => {
    setSelectedSeries(item);
    setNewName(item.name);
    setRenameModalVisible(true);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (selectedSeries && newName.trim()) {
      updateSeriesName(db, selectedSeries.seriesId, newName.trim());
      setRenameModalVisible(false);
      setSelectedSeries(null);
      setNewName('');
    }
  }, [db, selectedSeries, newName]);

  const handleDelete = useCallback((item: Series) => {
    Alert.alert(
      'Delete Series',
      `Are you sure you want to delete "${item.name}"? This will remove all ${item.pointCount} location points.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSeries(db, item.seriesId),
        },
      ]
    );
  }, [db]);

  const handlePress = useCallback((item: Series) => {
    if (selectionMode) {
      toggleSelection(item.seriesId);
    } else {
      router.push(`/series/${item.seriesId}`);
    }
  }, [router, selectionMode, toggleSelection]);

  const handleLongPress = useCallback((item: Series) => {
    if (selectionMode) {
      return;
    }
    setSelectionMode(true);
    setSelectedIds(new Set([item.seriesId]));
  }, [selectionMode]);

  /** Batch delete selected series */
  const handleBatchDelete = useCallback(() => {
    const count = selectedIds.size;
    const totalPoints = series
      .filter(s => selectedIds.has(s.seriesId))
      .reduce((sum, s) => sum + (s.pointCount ?? 0), 0);

    Alert.alert(
      'Delete Series',
      `Delete ${count} series? This will remove all ${totalPoints} location points.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            for (const id of selectedIds) {
              deleteSeries(db, id);
            }
            clearSelection();
          },
        },
      ]
    );
  }, [db, selectedIds, series, clearSelection]);

  /** Merge selected series - show target picker */
  const handleMerge = useCallback(() => {
    const selectedSeriesList = series.filter(s => selectedIds.has(s.seriesId));
    if (selectedSeriesList.length < 2) {
      Alert.alert('Select More', 'Select at least 2 series to merge.');
      return;
    }

    const options = selectedSeriesList.map(s => ({
      text: s.name,
      onPress: () => {
        const otherIds = selectedSeriesList
          .filter(other => other.seriesId !== s.seriesId)
          .map(other => other.seriesId);
        const totalPoints = selectedSeriesList.reduce((sum, item) => sum + (item.pointCount ?? 0), 0);

        Alert.alert(
          'Confirm Merge',
          `Merge ${selectedSeriesList.length} series into "${s.name}"? (${totalPoints} total points)`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge',
              onPress: () => {
                mergeSeries(db, s.seriesId, otherIds);
                clearSelection();
              },
            },
          ]
        );
      },
    }));

    Alert.alert(
      'Merge Into',
      'Select the target series to merge into:',
      [...options, { text: 'Cancel', style: 'cancel' }]
    );
  }, [db, selectedIds, series, clearSelection]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Series }) => {
    const isSelected = selectedIds.has(item.seriesId);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {selectionMode && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isActive && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Recording</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          {item.city && (
            <Text style={styles.cardLocation}>
              {item.city}{item.country ? `, ${item.country}` : ''}
            </Text>
          )}
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.pointCount}>{item.pointCount} points</Text>
          {!selectionMode && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleContinue(item)}
              >
                <Text style={styles.actionText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!isDbReady) {
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
        {selectionMode ? (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={clearSelection}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.selectionCount}>{selectedIds.size} selected</Text>
          </View>
        ) : (
          <Text style={styles.title}>History</Text>
        )}
      </View>

      <View style={styles.listContainer}>
        {series.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tracking history</Text>
            <Text style={styles.emptyText}>
              Start tracking from the Map tab to create your first series.
            </Text>
          </View>
        ) : (
          <FlatList
            data={series}
            keyExtractor={(item) => item.seriesId.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Selection Action Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <View style={[styles.actionBar, { marginBottom: insets.bottom + 50 }]}>
          <TouchableOpacity
            style={[styles.actionBarButton, styles.deleteButton]}
            onPress={handleBatchDelete}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBarButton, styles.mergeButton]}
            onPress={handleMerge}
            disabled={selectedIds.size < 2}
          >
            <Text style={[
              styles.mergeButtonText,
              selectedIds.size < 2 && styles.disabledText
            ]}>
              Merge
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRenameModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Rename Series</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Series name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveRename}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  listContainer: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA4335',
    marginRight: 4,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EA4335',
  },
  cardDetails: {
    marginBottom: 12,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    color: '#888888',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  pointCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4285F4',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
  },
  /** Selection mode styles */
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: '#4285F4',
  },
  selectionCount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionBarButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA4335',
  },
  mergeButton: {
    backgroundColor: '#E3F2FD',
  },
  mergeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
  },
  disabledText: {
    opacity: 0.4,
  },
});
