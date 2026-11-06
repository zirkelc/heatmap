import { describe, expect, test } from 'vitest';
import { DISTANCE_INTERVAL_OPTIONS, TIME_INTERVAL_OPTIONS, nearestOptionIndex } from './settings';

describe('nearestOptionIndex', () => {
  test('should return the index of an option', () => {
    // Arrange
    const value = 30_000;

    // Act
    const result = nearestOptionIndex(TIME_INTERVAL_OPTIONS, value);

    // Assert
    expect(TIME_INTERVAL_OPTIONS[result]).toBe(30_000);
  });

  test('should return the nearest option for a value that is not an option', () => {
    // Arrange
    const value = 40;

    // Act
    const result = nearestOptionIndex(DISTANCE_INTERVAL_OPTIONS, value);

    // Assert
    expect(DISTANCE_INTERVAL_OPTIONS[result]).toBe(30);
  });
});
