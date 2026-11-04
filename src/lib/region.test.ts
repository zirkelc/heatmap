import { describe, expect, test } from 'vitest';
import { calculateRegion } from './region';

describe('calculateRegion', () => {
  test('should return null without points', () => {
    // Act
    const result = calculateRegion([]);

    // Assert
    expect(result).toBe(null);
  });

  test('should center on the points with 20% padding', () => {
    // Arrange
    const points = [
      { latitude: 52.5, longitude: 13.3 },
      { latitude: 52.6, longitude: 13.5 },
    ];

    // Act
    const result = calculateRegion(points);

    // Assert
    expect(result?.latitude).toBeCloseTo(52.55);
    expect(result?.longitude).toBeCloseTo(13.4);
    expect(result?.latitudeDelta).toBeCloseTo(0.12);
    expect(result?.longitudeDelta).toBeCloseTo(0.24);
  });

  test('should use a minimum span for a single point', () => {
    // Act
    const result = calculateRegion([{ latitude: 52.5, longitude: 13.3 }]);

    // Assert
    expect(result).toEqual({ latitude: 52.5, longitude: 13.3, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  });
});
