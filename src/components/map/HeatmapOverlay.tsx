import React, { memo } from 'react';
import { Heatmap } from 'react-native-maps';
import type { HeatmapPoint } from '../../hooks/useLiveHeatmap';

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
        // Red starts below the maximum, so that places with many points stand out
        startPoints: [0.01, 0.1, 0.25, 0.45, 0.7],
        colorMapSize: 256,
      }}
    />
  );
});
