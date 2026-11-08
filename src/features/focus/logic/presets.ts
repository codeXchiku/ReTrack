import type { TimerConfig, TimerMode } from './types';

export interface PomodoroPreset {
  label: string;
  focusMin: number;
  breakMin: number;
}

export const POMODORO_PRESETS: readonly PomodoroPreset[] = [
  { label: '25 / 5', focusMin: 25, breakMin: 5 },
  { label: '50 / 10', focusMin: 50, breakMin: 10 },
];

export const COUNTDOWN_PRESETS_MIN: readonly number[] = [15, 30, 45, 60];

export const DEFAULT_ROUNDS = 4;

export const MAX_STOPWATCH_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const MINUTE_MS = 60 * 1000;

/**
 * Calculates long break duration: min(breakMs * 3, 30 minutes).
 */
export function longBreakFor(breakMs: number): number {
  if (!Number.isFinite(breakMs) || breakMs <= 0) {
    return 0;
  }
  return Math.min(breakMs * 3, 30 * MINUTE_MS);
}

export type ConfigValidationError =
  | 'invalid_mode'
  | 'invalid_focus_duration'
  | 'invalid_break_duration'
  | 'invalid_long_break_duration'
  | 'invalid_rounds';

export type ConfigValidationResult =
  | { ok: true; value: TimerConfig }
  | { ok: false; error: ConfigValidationError };

/**
 * Validates a timer configuration against Study Dojo bounds:
 * - countdown: focus 1..600 min
 * - pomodoro: focus 1..180 min, break 1..60 min, rounds 1..8
 * - stopwatch: has no duration constraint
 * Reject zero, negative, and NaN values.
 */
export function validateConfig(config: TimerConfig): ConfigValidationResult {
  if (!config || (config.mode !== 'countdown' && config.mode !== 'stopwatch' && config.mode !== 'pomodoro')) {
    return { ok: false, error: 'invalid_mode' };
  }

  if (config.mode === 'stopwatch') {
    return { ok: true, value: config };
  }

  if (config.mode === 'countdown') {
    if (
      !Number.isFinite(config.focusMs) ||
      config.focusMs < 1 * MINUTE_MS ||
      config.focusMs > 600 * MINUTE_MS
    ) {
      return { ok: false, error: 'invalid_focus_duration' };
    }
    return { ok: true, value: config };
  }

  // Pomodoro validation
  if (
    !Number.isFinite(config.focusMs) ||
    config.focusMs < 1 * MINUTE_MS ||
    config.focusMs > 180 * MINUTE_MS
  ) {
    return { ok: false, error: 'invalid_focus_duration' };
  }

  if (
    !Number.isFinite(config.breakMs) ||
    config.breakMs < 1 * MINUTE_MS ||
    config.breakMs > 60 * MINUTE_MS
  ) {
    return { ok: false, error: 'invalid_break_duration' };
  }

  if (
    !Number.isFinite(config.longBreakMs) ||
    config.longBreakMs < 1 * MINUTE_MS ||
    config.longBreakMs > 60 * MINUTE_MS
  ) {
    return { ok: false, error: 'invalid_long_break_duration' };
  }

  if (
    !Number.isFinite(config.rounds) ||
    !Number.isInteger(config.rounds) ||
    config.rounds < 1 ||
    config.rounds > 8
  ) {
    return { ok: false, error: 'invalid_rounds' };
  }

  return { ok: true, value: config };
}

export type BuildConfigOptions = Partial<Omit<TimerConfig, 'mode'>> & {
  mode: TimerMode;
};

/**
 * Builds a complete TimerConfig with standard defaults.
 */
export function buildConfig(options: BuildConfigOptions): TimerConfig {
  const mode = options.mode;
  const subjectId = options.subjectId ?? null;
  const silence = options.silence ?? false;
  const keepAwake = options.keepAwake ?? false;

  if (mode === 'stopwatch') {
    return {
      mode,
      subjectId,
      focusMs: 0,
      breakMs: 0,
      longBreakMs: 0,
      rounds: 1,
      silence,
      keepAwake,
    };
  }

  if (mode === 'countdown') {
    return {
      mode,
      subjectId,
      focusMs: options.focusMs ?? 25 * MINUTE_MS,
      breakMs: 0,
      longBreakMs: 0,
      rounds: 1,
      silence,
      keepAwake,
    };
  }

  // Pomodoro
  const focusMs = options.focusMs ?? 25 * MINUTE_MS;
  const breakMs = options.breakMs ?? 5 * MINUTE_MS;
  const longBreakMs = options.longBreakMs ?? longBreakFor(breakMs);
  const rounds = options.rounds ?? DEFAULT_ROUNDS;

  return {
    mode,
    subjectId,
    focusMs,
    breakMs,
    longBreakMs,
    rounds,
    silence,
    keepAwake,
  };
}
