import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import type { Series } from '../../db/schema';

interface SeriesPromptProps {
  visible: boolean;
  series: Array<Series>;
  onStartNew: () => void;
  onContinue: (seriesId: number) => void;
  onClose: () => void;
}

/**
 * Modal for choosing to start a new series or continue an existing one.
 */
export function SeriesPrompt({
  visible,
  series,
  onStartNew,
  onContinue,
  onClose,
}: SeriesPromptProps) {
  const recentSeries = series.slice(0, 5);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Start Tracking</Text>

          <TouchableOpacity style={styles.newButton} onPress={onStartNew}>
            <Text style={styles.newButtonText}>+ Start New Series</Text>
          </TouchableOpacity>

          {recentSeries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Or continue recent</Text>
              <FlatList
                data={recentSeries}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.seriesItem}
                    onPress={() => onContinue(item.id)}
                  >
                    <Text style={styles.seriesName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.seriesInfo}>
                      {item.point_count} points
                    </Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  newButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 12,
  },
  seriesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 8,
  },
  seriesName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  seriesInfo: {
    fontSize: 13,
    color: '#888888',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});
