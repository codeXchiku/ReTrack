import type { TimerState } from './types';

/**
 * Returns the total elapsed milliseconds in the current phase.
 * Safe against clock going backwards (treats backwards jump as 0 for that segment).
 */
export function getElapsedMs(state: TimerState, now: number): number {
  const currentSegment =
    state.status === 'running' && state.segmentStartedAt !== null
      ? Math.max(0, now - state.segmentStartedAt)
      : 0;

  const total = state.elapsedBeforeMs + currentSegment;
  return Number.isFinite(total) ? Math.max(0, total) : 0;
}

/**
 * Returns the remaining milliseconds in the current phase.
 * Returns null for stopwatch.
 * Never negative, never NaN.
 */
export function getRemainingMs(state: TimerState, now: number): number | null {
  if (state.phaseDurationMs === null) {
    return null;
  }

  const elapsed = getElapsedMs(state, now);
  const remaining = Math.max(0, state.phaseDurationMs - elapsed);
  return Number.isFinite(remaining) ? remaining : 0;
}

/**
 * Returns progress from 0 to 1 of the current phase.
 * Returns null for stopwatch.
 */
export function getProgress(state: TimerState, now: number): number | null {
  if (state.phaseDurationMs === null || state.phaseDurationMs <= 0) {
    return null;
  }

  const elapsed = getElapsedMs(state, now);
  const ratio = elapsed / state.phaseDurationMs;
  if (!Number.isFinite(ratio)) {
    return 0;
  }
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Returns the total focus milliseconds accumulated so far.
 * If currently in a focus phase, includes partial elapsed time in this phase.
 * Stable (does not grow) while paused, awaitingNext, or in break phases.
 */
export function getFocusedMs(state: TimerState, now: number): number {
  if (state.status === 'finished') {
    return state.focusedMsDone;
  }

  if (state.phase !== 'focus') {
    return state.focusedMsDone;
  }

  // Currently in focus phase
  let currentFocusElapsed = 0;
  if (state.status === 'running') {
    const currentSegment =
      state.segmentStartedAt !== null
        ? Math.max(0, now - state.segmentStartedAt)
        : 0;
    currentFocusElapsed = state.elapsedBeforeMs + currentSegment;
    if (state.phaseDurationMs !== null) {
      currentFocusElapsed = Math.min(state.phaseDurationMs, currentFocusElapsed);
    }
  } else if (state.status === 'paused') {
    currentFocusElapsed = state.elapsedBeforeMs;
    if (state.phaseDurationMs !== null) {
      currentFocusElapsed = Math.min(state.phaseDurationMs, currentFocusElapsed);
    }
  }

  const total = state.focusedMsDone + Math.max(0, currentFocusElapsed);
  return Number.isFinite(total) ? total : state.focusedMsDone;
}

/**
 * Returns the epoch timestamp when the current phase will end, or null if not running or stopwatch.
 */
export function getEndsAt(state: TimerState): number | null {
  if (
    state.status !== 'running' ||
    state.segmentStartedAt === null ||
    state.phaseDurationMs === null
  ) {
    return null;
  }

  const remaining = Math.max(0, state.phaseDurationMs - state.elapsedBeforeMs);
  return state.segmentStartedAt + remaining;
}

/**
 * Returns whether the timer is currently active (running, paused, or awaitingNext).
 */
export function isActive(state: TimerState): boolean {
  return (
    state.status === 'running' ||
    state.status === 'paused' ||
    state.status === 'awaitingNext'
  );
}
