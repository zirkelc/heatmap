/**
 * Rules that keep the recording series consistent with the OS location updates.
 */

/**
 * True if one of the series IDs is the series that records now.
 * Such a series must not be deleted, or new points have no series to go to.
 */
export function includesRecordingSeries(seriesIds: Iterable<number>, recordingSeriesId: number | null): boolean {
  if (recordingSeriesId === null) {
    return false;
  }
  for (const id of seriesIds) {
    if (id === recordingSeriesId) {
      return true;
    }
  }
  return false;
}

/**
 * The series that a merge may go into. If the recording series is selected, it must
 * be the target, because a merge deletes all other selected series.
 */
export function getMergeTargetIds(selectedIds: Array<number>, recordingSeriesId: number | null): Array<number> {
  if (includesRecordingSeries(selectedIds, recordingSeriesId)) {
    return [recordingSeriesId as number];
  }
  return selectedIds;
}

export type TrackingRepair = 'none' | 'deactivate-series' | 'stop-updates';

/**
 * Compare the OS location updates with the active series in the database.
 * The OS can stop the updates (permission revoked, app terminated), and the
 * series can disappear while the updates run.
 */
export function getTrackingRepair(state: { isOsTracking: boolean; hasActiveSeries: boolean }): TrackingRepair {
  if (!state.isOsTracking && state.hasActiveSeries) {
    return 'deactivate-series';
  }
  if (state.isOsTracking && !state.hasActiveSeries) {
    return 'stop-updates';
  }
  return 'none';
}
