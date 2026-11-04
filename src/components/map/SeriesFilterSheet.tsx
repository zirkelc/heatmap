import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Series } from '../../db/schema';

interface SeriesFilterSheetProps {
  visible: boolean;
  series: Array<Series>;
  /** Empty means that all series are shown */
  selectedIds: Array<number>;
  onSelect: (seriesIds: Array<number>) => void;
  onClose: () => void;
}

/**
 * Bottom sheet that selects which series the map shows.
 */
export function SeriesFilterSheet({ visible, series, selectedIds, onSelect, onClose }: SeriesFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const showsAll = selectedIds.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[styles.container, { paddingBottom: insets.bottom + 16 }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.title}>Show on Map</Text>

          <TouchableOpacity
            style={[styles.item, showsAll && styles.itemSelected]}
            onPress={() => onSelect([])}
          >
            <Text style={[styles.itemName, showsAll && styles.itemNameSelected]}>All Series</Text>
            {showsAll && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>

          <FlatList
            style={styles.list}
            data={series}
            keyExtractor={(item) => item.seriesId.toString()}
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item.seriesId);
              return (
                <TouchableOpacity
                  style={[styles.item, selected && styles.itemSelected]}
                  onPress={() => onSelect([item.seriesId])}
                >
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, selected && styles.itemNameSelected]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemInfo}>{item.pointCount} points</Text>
                  </View>
                  {selected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
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
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: '75%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 8,
  },
  itemSelected: {
    backgroundColor: '#E3F2FD',
  },
  itemText: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  itemNameSelected: {
    color: '#1A73E8',
  },
  itemInfo: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A73E8',
  },
});
