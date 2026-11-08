import { beforeEach, describe, expect, test } from 'vitest';
import { createTestDatabase } from '../testing';
import type { DB } from '../types';
import { DISTANCE_INTERVAL_OPTIONS, TIME_INTERVAL_OPTIONS, getSetting, incrementCounter, nearestOptionIndex } from './settings';

let db: DB;

beforeEach(async () => {
  db = await createTestDatabase();
});

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

describe('incrementCounter', () => {
  test('should start at 1 and add one on each call', () => {
    // Arrange
    const key = 'stoppedRecordings';

    // Act
    const results = [incrementCounter(db, key), incrementCounter(db, key), incrementCounter(db, key)];

    // Assert
    expect(results).toEqual([1, 2, 3]);
    expect(getSetting(db, key)).toBe('3');
  });
});
