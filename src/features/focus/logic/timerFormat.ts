import { formatDuration } from '@/core/time';

/**
 * Formats a duration in milliseconds into a clock display string (MM:SS or H:MM:SS).
 * For countdown, rounds up to whole seconds so 0.5s displays as 1s.
 * For stopwatch, rounds down to whole seconds.
 */
export function formatClock(
  ms: number,
  mode: 'countdown' | 'stopwatch' | 'pomodoro' = 'countdown',
): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '00:00';
  }

  const totalSecs =
    mode === 'stopwatch' ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);

  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Returns the confirmation message shown when the user taps Stop.
 */
export function getStopDialogMessage(focusedSecs: number): string {
  if (focusedSecs < 30) {
    return 'End this session? Sessions under 30 seconds are not saved.';
  }
  const formatted = formatDuration(focusedSecs);
  return `End this session? ${formatted} of focus will be saved.`;
}

export type ParseMinutesResult =
  | { ok: true; minutes: number; focusMs: number }
  | { ok: false; error: string };

/**
 * Parses and validates custom duration input (1 - 600 minutes).
 */
export function parseCustomMinutes(text: string): ParseMinutesResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: 'Duration cannot be empty' };
  }

  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { ok: false, error: 'Enter a whole number of minutes' };
  }

  if (num < 1) {
    return { ok: false, error: 'Minimum duration is 1 minute' };
  }

  if (num > 600) {
    return { ok: false, error: 'Maximum duration is 600 minutes' };
  }

  return { ok: true, minutes: num, focusMs: num * 60 * 1000 };
}
