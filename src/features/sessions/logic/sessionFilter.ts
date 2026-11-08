/**
 * Minimum focused seconds required to save a session (30 seconds).
 * Sessions under 30s are considered noise and discarded.
 */
export const MIN_SAVE_SECS = 30;

/**
 * Returns true if the session duration meets the threshold to be saved in the database.
 */
export function shouldSaveSession(focusedSecs: number): boolean {
  if (!Number.isFinite(focusedSecs)) {
    return false;
  }
  return focusedSecs >= MIN_SAVE_SECS;
}
