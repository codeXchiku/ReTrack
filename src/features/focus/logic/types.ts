/**
 * Pure type definitions for the Study Dojo timer engine.
 * No framework or platform imports.
 */

export type TimerMode = 'countdown' | 'stopwatch' | 'pomodoro';

export type Phase = 'focus' | 'break' | 'longBreak';

export type TimerStatus = 'running' | 'paused' | 'awaitingNext' | 'finished';

export interface TimerConfig {
  mode: TimerMode;
  subjectId: string | null;
  focusMs: number;
  breakMs: number;
  longBreakMs: number;
  rounds: number;
  silence: boolean;
  keepAwake: boolean;
}

export interface TimerState {
  sessionId: string;
  config: TimerConfig;
  status: TimerStatus;
  phase: Phase;
  round: number;
  /** Duration of the current phase in ms, or null for stopwatch */
  phaseDurationMs: number | null;
  /** Epoch timestamp when current running segment started; set only while running */
  segmentStartedAt: number | null;
  /** Elapsed ms of this phase accumulated before the current running segment */
  elapsedBeforeMs: number;
  /** Focus time in ms of fully completed focus phases */
  focusedMsDone: number;
  startedAt: number;
  endedAt: number | null;
  completed: boolean;
}

export type TimerAction =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'startNext' }
  | { type: 'skipBreak' }
  | { type: 'tick' };

export type TimerEffect =
  | { type: 'phaseStarted'; phase: Phase; round: number; endsAt: number | null }
  | { type: 'paused' }
  | { type: 'resumed'; phase: Phase; endsAt: number | null }
  | { type: 'awaitingNext'; nextRound: number }
  | { type: 'sessionFinished'; focusedMs: number; completed: boolean };
