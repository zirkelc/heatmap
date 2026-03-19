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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabaseReady } from '../../src/contexts/DatabaseContext';
import { useTracking } from '../../src/contexts/TrackingContext';
import { useSeries } from '../../src/hooks/useSeries';
import type { Series } from '../../src/db/schema';

export default function HistoryScreen() {
  const router = useRouter();
  const isDbReady = useDatabaseReady();
  const { continueSeries, isTracking } = useTracking();
  const { series, refresh, rename, remove } = useSeries();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [newName, setNewName] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
      rename(selectedSeries.seriesId, newName.trim());
      setRenameModalVisible(false);
      setSelectedSeries(null);
      setNewName('');
    }
  }, [selectedSeries, newName, rename]);

  const handleDelete = useCallback((item: Series) => {
    Alert.alert(
      'Delete Series',
      `Are you sure you want to delete "${item.name}"? This will remove all ${item.pointCount} location points.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove(item.seriesId),
        },
      ]
    );
  }, [remove]);

  const handlePress = useCallback((item: Series) => {
    router.push(`/series/${item.seriesId}`);
  }, [router]);

  const handleLongPress = useCallback((item: Series) => {
    Alert.alert(
      item.name,
      'Choose an action',
      [
        { text: 'Continue Tracking', onPress: () => handleContinue(item) },
        { text: 'Rename', onPress: () => handleRename(item) },
        { text: 'Delete', onPress: () => handleDelete(item), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handleContinue, handleRename, handleDelete]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Series }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
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
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleContinue(item)}
          >
            <Text style={styles.actionText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>History</Text>
      </View>

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
});
