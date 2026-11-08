import * as StoreReview from 'expo-store-review';
import { incrementCounter } from '../db/queries/settings';
import type { DB } from '../db/types';

const STOPPED_RECORDINGS_KEY = 'stoppedRecordings';

/** The app asks for a rating after this number of recordings with points */
export const REVIEW_AFTER_RECORDINGS = 3;

/** The App Store page where the user can write a review */
export const WRITE_REVIEW_URL = 'https://apps.apple.com/app/id6830774275?action=write-review';

/**
 * Count a stopped recording. After the third recording with points, show the rating prompt
 * of iOS one time. iOS decides if the prompt really shows, and shows it at most 3 times a year.
 */
export async function onRecordingStopped(db: DB, pointCount: number): Promise<void> {
  if (pointCount === 0) {
    return;
  }
  const count = incrementCounter(db, STOPPED_RECORDINGS_KEY);
  if (count !== REVIEW_AFTER_RECORDINGS) {
    return;
  }
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  } catch (error) {
    console.error('[Review] Failed to request a review:', error);
  }
}
