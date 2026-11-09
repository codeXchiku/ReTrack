import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export interface UseNowOptions {
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Hook returning the current epoch timestamp in milliseconds.
 * - Ticks every intervalMs (default 1000ms) only when enabled (default true).
 * - Schedules its next tick aligned to the next whole interval boundary.
 * - Pauses ticking when AppState is not 'active', and recomputes immediately when returning to 'active'.
 * - Cleans up all timers on unmount or when disabled.
 */
export function useNow(options: UseNowOptions = {}): number {
  const { enabled = true, intervalMs = 1000 } = options;
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const scheduleNextTick = () => {
      if (isDisposed) {
        return;
      }
      const current = Date.now();
      const delay = intervalMs - (current % intervalMs);
      timeoutId = setTimeout(() => {
        if (!isDisposed) {
          if (AppState.currentState === 'active') {
            setNow(Date.now());
          }
          scheduleNextTick();
        }
      }, delay);
    };

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        setNow(Date.now());
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        scheduleNextTick();
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    setNow(Date.now());
    if (AppState.currentState === 'active') {
      scheduleNextTick();
    }

    return () => {
      isDisposed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      sub.remove();
    };
  }, [enabled, intervalMs]);

  return now;
}
