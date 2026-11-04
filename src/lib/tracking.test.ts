import { describe, expect, test } from 'vitest';
import { getMergeTargetIds, getTrackingRepair, includesRecordingSeries } from './tracking';

describe('includesRecordingSeries', () => {
  test('should be true when the recording series is in the list', () => {
    // Arrange
    const ids = [1, 2, 3];

    // Act
    const result = includesRecordingSeries(ids, 2);

    // Assert
    expect(result).toBe(true);
  });

  test('should be false when nothing records', () => {
    // Arrange
    const ids = [1, 2, 3];

    // Act
    const result = includesRecordingSeries(ids, null);

    // Assert
    expect(result).toBe(false);
  });
});

describe('getMergeTargetIds', () => {
  test('should offer every selected series when none of them records', () => {
    // Arrange
    const ids = [1, 2, 3];

    // Act
    const result = getMergeTargetIds(ids, 7);

    // Assert
    expect(result).toEqual([1, 2, 3]);
  });

  test('should offer only the recording series, so that it is never merged away', () => {
    // Arrange
    const ids = [1, 2, 3];

    // Act
    const result = getMergeTargetIds(ids, 2);

    // Assert
    expect(result).toEqual([2]);
  });
});

describe('getTrackingRepair', () => {
  test('should do nothing when the OS state and the database agree', () => {
    // Act
    const tracking = getTrackingRepair({ isOsTracking: true, hasActiveSeries: true });
    const idle = getTrackingRepair({ isOsTracking: false, hasActiveSeries: false });

    // Assert
    expect([tracking, idle]).toEqual(['none', 'none']);
  });

  test('should deactivate the series when the OS stopped the updates', () => {
    // Act
    const result = getTrackingRepair({ isOsTracking: false, hasActiveSeries: true });

    // Assert
    expect(result).toBe('deactivate-series');
  });

  test('should stop the updates when no series receives them', () => {
    // Act
    const result = getTrackingRepair({ isOsTracking: true, hasActiveSeries: false });

    // Assert
    expect(result).toBe('stop-updates');
  });
});
