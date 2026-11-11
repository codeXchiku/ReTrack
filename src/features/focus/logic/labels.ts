import { formatDuration } from '@/core/time';
import type { Phase, TimerState, TimerStatus } from './types';

/**
 * Returns a user-friendly round label (e.g., "Round 1 / 4").
 * Returns an empty string for non-pomodoro modes.
 */
export function roundLabel(state: TimerState): string {
  if (state.config.mode !== 'pomodoro') {
    return '';
  }
  return `Round ${state.round} / ${state.config.rounds}`;
}

/**
 * Returns the uppercase display title of the current phase.
 */
export function phaseTitle(state: TimerState): string {
  return phaseTitleFromPhase(state.phase);
}

/**
 * Returns the uppercase display title for a given phase.
 */
export function phaseTitleFromPhase(phase: Phase): string {
  switch (phase) {
    case 'focus':
      return 'FOCUS';
    case 'break':
      return 'BREAK';
    case 'longBreak':
      return 'LONG BREAK';
    default:
      return 'FOCUS';
  }
}

/**
 * Returns the label for the primary action button based on timer status.
 */
export function nextActionLabel(state: TimerState): string {
  if (state.status === 'awaitingNext') {
    return `Start round ${state.round + 1}`;
  }
  if (state.status === 'running') {
    return 'Pause';
  }
  if (state.status === 'paused') {
    return 'Resume';
  }
  return 'Start';
}

/**
 * Returns the calm prompt shown when a break ends and the app awaits the next round.
 */
export function awaitingNextTitle(round: number): string {
  return `Break over. Ready for round ${round}?`;
}

export interface RoundDotState {
  index: number;
  filled: boolean;
  active: boolean;
}

/**
 * Computes the state of each round dot for a Pomodoro session.
 * - Completed focus rounds have filled = true.
 * - Current in-progress focus round has active = true, filled = false.
 * - Future rounds have filled = false, active = false.
 */
export function computeRoundDots(
  totalRounds: number,
  currentRound: number,
  phase: Phase,
  status: TimerStatus,
): RoundDotState[] {
  const dots: RoundDotState[] = [];
  const completedRounds =
    status === 'awaitingNext'
      ? currentRound
      : phase === 'focus'
      ? currentRound - 1
      : currentRound;

  for (let i = 1; i <= totalRounds; i++) {
    const isCompleted = i <= completedRounds;
    const isActive =
      status !== 'awaitingNext' &&
      i === currentRound &&
      phase === 'focus' &&
      status !== 'finished';

    dots.push({
      index: i,
      filled: isCompleted,
      active: isActive,
    });
  }

  return dots;
}

/**
 * Returns a concise string for stopped-early Pomodoro sessions stating how many rounds were completed.
 * Example: "2 rounds completed", "1 round completed", "0 rounds completed"
 */
export function pomodoroStoppedEarlyText(roundsCompleted: number): string {
  const roundWord = roundsCompleted === 1 ? 'round' : 'rounds';
  return `${roundsCompleted} ${roundWord} completed`;
}

/**
 * Computes the subtitle description for a finished or stopped-early Pomodoro session.
 * Example completed: "4 rounds - 1h 40m focused"
 * Example stopped early: "2 of 4 rounds completed - 50m focused"
 */
export function pomodoroFinishedSubtitle(
  roundsDone: number,
  totalRounds: number,
  focusedSecs: number,
  completed: boolean,
): string {
  const durationStr = formatDuration(focusedSecs);

  if (completed) {
    const roundWord = totalRounds === 1 ? 'round' : 'rounds';
    return `${totalRounds} ${roundWord} - ${durationStr} focused`;
  }

  const roundWord = roundsDone === 1 ? 'round' : 'rounds';
  if (roundsDone === 0) {
    return `0 of ${totalRounds} ${roundWord} completed - ${durationStr} focused`;
  }

  return `${roundsDone} of ${totalRounds} ${roundWord} completed - ${durationStr} focused`;
}
