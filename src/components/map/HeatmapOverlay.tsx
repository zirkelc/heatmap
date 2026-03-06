import React, { memo } from 'react';
import { Heatmap } from 'react-native-maps';
import type { HeatmapPoint } from '../../hooks/useHeatmapPoints';

interface HeatmapOverlayProps {
  points: Array<HeatmapPoint>;
}

/**
 * Heatmap overlay component for displaying location data.
 */
export const HeatmapOverlay = memo(function HeatmapOverlay({ points }: HeatmapOverlayProps) {
  if (points.length === 0) {
    return null;
  }

  const heatmapPoints = points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    weight: point.weight,
  }));

  return (
    <Heatmap
      points={heatmapPoints}
      opacity={0.7}
      radius={40}
      gradient={{
        colors: ['#79BC6A', '#BBCF4C', '#EEC20B', '#F29305', '#E50000'],
        startPoints: [0.01, 0.25, 0.5, 0.75, 1],
        colorMapSize: 256,
      }}
    />
  );
});
