import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ActivityIndicator } from 'react-native';

interface TrackingButtonProps {
  isTracking: boolean;
  isLoading?: boolean;
  onPress: () => void;
  /** Distance from the bottom edge of the screen */
  bottom: number;
}

/**
 * Floating action button for starting/stopping location tracking.
 */
export function TrackingButton({ isTracking, isLoading, onPress, bottom }: TrackingButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { bottom }, isTracking && styles.buttonActive]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          <View style={[styles.icon, isTracking && styles.iconActive]} />
          <Text style={styles.label}>{isTracking ? 'Stop' : 'Start'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#EA4335',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  iconActive: {
    borderRadius: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
