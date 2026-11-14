import { formatDuration } from '@/core/time';
import type { Phase, TimerState } from './types';

export interface ScheduledAlert {
  title: string;
  body: string;
}

/**
 * Returns a human-friendly capitalized phase name.
 */
export function formatPhaseTitle(phase: Phase): string {
  switch (phase) {
    case 'focus':
      return 'Focus';
    case 'break':
      return 'Break';
    case 'longBreak':
      return 'Long break';
    default:
      return 'Focus';
  }
}

/**
 * Generates the title for an ongoing session notification.
 * Pattern: "<Phase> - <Subject or 'Study'>"
 * Example: "Focus - Physics" or "Focus - Study"
 */
export function getRunningNotificationTitle(
  phase: Phase,
  subjectName?: string | null,
): string {
  const phaseLabel = formatPhaseTitle(phase);
  const subjectLabel =
    subjectName && subjectName.trim().length > 0 ? subjectName.trim() : 'Study';
  return `${phaseLabel} - ${subjectLabel}`;
}

/**
 * Generates the body for an ongoing session notification.
 * - Pomodoro: "Round X of Y"
 * - Countdown/Stopwatch: "Stay focused"
 */
export function getRunningNotificationBody(state: TimerState): string {
  if (state.config.mode === 'pomodoro') {
    return `Round ${state.round} of ${state.config.rounds}`;
  }
  return 'Stay focused';
}

/**
 * Generates the title for a paused notification.
 * Example: "Focus - Physics - Paused"
 */
export function getPausedNotificationTitle(
  phase: Phase,
  subjectName?: string | null,
): string {
  return `${getRunningNotificationTitle(phase, subjectName)} - Paused`;
}

/**
 * Formats a duration in minutes with singular/plural unit.
 * Example: 60000ms -> "1 min", 300000ms -> "5 min"
 */
export function formatMinutesLabel(durationMs: number): string {
  const mins = Math.max(1, Math.round(durationMs / 60000));
  return `${mins} min`;
}

/**
 * Pure function that determines the alert title and body scheduled for phase completion (at endsAt).
 * Returns null if the session does not have an alert (e.g. Stopwatch mode).
 */
export function getScheduledAlert(
  state: TimerState,
  subjectName?: string | null,
): ScheduledAlert | null {
  const { mode, rounds, focusMs, breakMs, longBreakMs } = state.config;
  const cleanSubject =
    subjectName && subjectName.trim().length > 0 ? subjectName.trim() : null;

  // Stopwatch runs indefinitely with no predetermined endsAt
  if (mode === 'stopwatch') {
    return null;
  }

  // Countdown completion
  if (mode === 'countdown') {
    const durStr = formatDuration(Math.round(focusMs / 1000));
    const body = cleanSubject
      ? `Session complete - ${durStr} of ${cleanSubject}`
      : `Session complete - ${durStr}`;
    return {
      title: 'Session complete',
      body,
    };
  }

  // Pomodoro phase transitions
  if (mode === 'pomodoro') {
    if (state.phase === 'focus') {
      if (state.round < rounds) {
        // Normal focus -> short break
        const breakStr = formatMinutesLabel(breakMs);
        return {
          title: 'Break time',
          body: `Round ${state.round} done - take a ${breakStr} break`,
        };
      }
      // Last focus round -> long break
      const lbStr = formatMinutesLabel(longBreakMs);
      return {
        title: 'Long break time',
        body: `Round ${state.round} done - take a ${lbStr} long break`,
      };
    }

    if (state.phase === 'break') {
      // Short break -> awaiting next round
      const nextRound = state.round + 1;
      return {
        title: 'Break over',
        body: `Break over - ready for round ${nextRound}?`,
      };
    }

    if (state.phase === 'longBreak') {
      // Long break -> session complete
      const totalPlannedFocusMs = rounds * focusMs;
      const durStr = formatDuration(Math.round(totalPlannedFocusMs / 1000));
      const body = cleanSubject
        ? `Session complete - ${durStr} of ${cleanSubject}`
        : `Session complete - ${durStr}`;
      return {
        title: 'Session complete',
        body,
      };
    }
  }

  return null;
}
