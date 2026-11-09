import { useNow } from '@/core/time';
import {
  getFocusedMs,
  getProgress,
  getRemainingMs,
} from '../logic/selectors';
import type { TimerState } from '../logic/types';
import { type FocusResult, useFocusStore } from '../store/focusStore';

/**
 * Returns the currently active timer state, or null if no session is active.
 */
export function useFocusActive(): TimerState | null {
  return useFocusStore(state => state.active);
}

/**
 * Returns the result of the most recently finished focus session.
 */
export function useFocusResult(): FocusResult | null {
  return useFocusStore(state => state.lastResult);
}

/**
 * Returns the current timestamp in milliseconds, ticking every 1000ms
 * ONLY while a session is running and the component is mounted/visible.
 */
export function useFocusNow(): number {
  const isRunning = useFocusStore(state => state.active?.status === 'running');
  return useNow({ enabled: isRunning, intervalMs: 1000 });
}

/**
 * Returns the remaining milliseconds in the current phase, or null for stopwatch / inactive.
 * Reactively updates every second while running.
 */
export function useRemainingMs(): number | null {
  const active = useFocusActive();
  const now = useFocusNow();
  if (!active) {
    return null;
  }
  return getRemainingMs(active, now);
}

/**
 * Returns the progress (0..1) of the current phase, or null for stopwatch / inactive.
 * Reactively updates every second while running.
 */
export function useProgress(): number | null {
  const active = useFocusActive();
  const now = useFocusNow();
  if (!active) {
    return null;
  }
  return getProgress(active, now);
}

/**
 * Returns the total focused milliseconds accumulated in the session so far.
 * Reactively updates every second while in a focus phase.
 */
export function useFocusedMs(): number {
  const active = useFocusActive();
  const now = useFocusNow();
  if (!active) {
    return 0;
  }
  return getFocusedMs(active, now);
}
