import { MAX_STOPWATCH_MS } from './presets';
import { getElapsedMs, getFocusedMs } from './selectors';
import type {
  Phase,
  TimerAction,
  TimerConfig,
  TimerEffect,
  TimerState,
} from './types';

/**
 * Starts a new timer session immediately in a focus phase at round 1.
 * Pure function: receives now (epoch ms).
 */
export function startSession(
  config: TimerConfig,
  now: number,
  sessionId: string,
): { state: TimerState; effects: TimerEffect[] } {
  const isStopwatch = config.mode === 'stopwatch';
  const phaseDurationMs = isStopwatch ? null : config.focusMs;
  const endsAt = isStopwatch ? null : now + config.focusMs;

  const state: TimerState = {
    sessionId,
    config,
    status: 'running',
    phase: 'focus',
    round: 1,
    phaseDurationMs,
    segmentStartedAt: now,
    elapsedBeforeMs: 0,
    focusedMsDone: 0,
    startedAt: now,
    endedAt: null,
    completed: false,
  };

  const effects: TimerEffect[] = [
    {
      type: 'phaseStarted',
      phase: 'focus',
      round: 1,
      endsAt,
    },
  ];

  return { state, effects };
}

/**
 * Applies a TimerAction to the state at timestamp now.
 * Never mutates input.
 * Invalid actions return the same state and empty effects without throwing.
 */
export function applyAction(
  state: TimerState,
  action: TimerAction,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  switch (action.type) {
    case 'tick':
      return handleTick(state, now);
    case 'pause':
      return handlePause(state, now);
    case 'resume':
      return handleResume(state, now);
    case 'stop':
      return handleStop(state, now);
    case 'startNext':
      return handleStartNext(state, now);
    case 'skipBreak':
      return handleSkipBreak(state, now);
    default:
      return { state, effects: [] };
  }
}

/**
 * Handles time passage while running.
 * Chains phase transitions until reaching a phase not yet ended, 'awaitingNext', or 'finished'.
 */
function handleTick(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (state.status !== 'running') {
    return { state, effects: [] };
  }

  // Stopwatch mode handling
  if (state.config.mode === 'stopwatch') {
    const segment =
      state.segmentStartedAt !== null
        ? Math.max(0, now - state.segmentStartedAt)
        : 0;
    const totalElapsed = state.elapsedBeforeMs + segment;

    if (totalElapsed >= MAX_STOPWATCH_MS) {
      const endedAt =
        state.segmentStartedAt !== null
          ? state.segmentStartedAt +
            Math.max(0, MAX_STOPWATCH_MS - state.elapsedBeforeMs)
          : now;

      const finishedState: TimerState = {
        ...state,
        status: 'finished',
        segmentStartedAt: null,
        elapsedBeforeMs: MAX_STOPWATCH_MS,
        focusedMsDone: MAX_STOPWATCH_MS,
        endedAt,
        completed: true,
      };

      return {
        state: finishedState,
        effects: [
          {
            type: 'sessionFinished',
            focusedMs: MAX_STOPWATCH_MS,
            completed: true,
          },
        ],
      };
    }

    return { state, effects: [] };
  }

  // Countdown & Pomodoro phase processing loop
  let currState: TimerState = { ...state };
  const accumulatedEffects: TimerEffect[] = [];

  while (
    currState.status === 'running' &&
    currState.phaseDurationMs !== null &&
    currState.phaseDurationMs > 0
  ) {
    const remainingInSegment = Math.max(
      0,
      currState.phaseDurationMs - currState.elapsedBeforeMs,
    );
    const phaseEndsAt =
      (currState.segmentStartedAt ?? now) + remainingInSegment;

    // Phase has not ended yet
    if (now < phaseEndsAt) {
      break;
    }

    // Phase ended at exact timestamp phaseEndsAt
    if (currState.config.mode === 'countdown') {
      const completedFocus = currState.config.focusMs;
      currState = {
        ...currState,
        status: 'finished',
        segmentStartedAt: null,
        elapsedBeforeMs: currState.phaseDurationMs,
        focusedMsDone: completedFocus,
        endedAt: phaseEndsAt,
        completed: true,
      };
      accumulatedEffects.push({
        type: 'sessionFinished',
        focusedMs: completedFocus,
        completed: true,
      });
      break;
    }

    // Pomodoro mode transitions
    if (currState.phase === 'focus') {
      const newFocusedMsDone =
        currState.focusedMsDone + currState.phaseDurationMs;
      const isLastRound = currState.round >= currState.config.rounds;

      if (isLastRound) {
        // Transition to longBreak
        const nextPhase: Phase = 'longBreak';
        const nextDuration = currState.config.longBreakMs;
        const nextEndsAt = phaseEndsAt + nextDuration;

        accumulatedEffects.push({
          type: 'phaseStarted',
          phase: nextPhase,
          round: currState.round,
          endsAt: nextEndsAt,
        });

        currState = {
          ...currState,
          phase: nextPhase,
          phaseDurationMs: nextDuration,
          segmentStartedAt: phaseEndsAt,
          elapsedBeforeMs: 0,
          focusedMsDone: newFocusedMsDone,
        };
      } else {
        // Transition to normal break
        const nextPhase: Phase = 'break';
        const nextDuration = currState.config.breakMs;
        const nextEndsAt = phaseEndsAt + nextDuration;

        accumulatedEffects.push({
          type: 'phaseStarted',
          phase: nextPhase,
          round: currState.round,
          endsAt: nextEndsAt,
        });

        currState = {
          ...currState,
          phase: nextPhase,
          phaseDurationMs: nextDuration,
          segmentStartedAt: phaseEndsAt,
          elapsedBeforeMs: 0,
          focusedMsDone: newFocusedMsDone,
        };
      }
    } else if (currState.phase === 'break') {
      // Normal break ends -> awaitingNext
      const nextRound = currState.round + 1;
      accumulatedEffects.push({
        type: 'awaitingNext',
        nextRound,
      });

      currState = {
        ...currState,
        status: 'awaitingNext',
        segmentStartedAt: null,
        elapsedBeforeMs: currState.phaseDurationMs,
      };
      // Loop stops at awaitingNext (waits for user action)
      break;
    } else if (currState.phase === 'longBreak') {
      // Long break ends -> finished
      accumulatedEffects.push({
        type: 'sessionFinished',
        focusedMs: currState.focusedMsDone,
        completed: true,
      });

      currState = {
        ...currState,
        status: 'finished',
        segmentStartedAt: null,
        elapsedBeforeMs: currState.phaseDurationMs,
        endedAt: phaseEndsAt,
        completed: true,
      };
      break;
    }
  }

  return { state: currState, effects: accumulatedEffects };
}

/**
 * Pauses a running session after processing pending phase ends.
 */
function handlePause(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (state.status !== 'running') {
    return { state, effects: [] };
  }

  // First process pending phase ends as if tick was called
  const tickResult = handleTick(state, now);
  if (tickResult.state.status !== 'running') {
    return tickResult;
  }

  const runningState = tickResult.state;
  const segment =
    runningState.segmentStartedAt !== null
      ? Math.max(0, now - runningState.segmentStartedAt)
      : 0;
  const newElapsedBefore = runningState.elapsedBeforeMs + segment;

  const pausedState: TimerState = {
    ...runningState,
    status: 'paused',
    segmentStartedAt: null,
    elapsedBeforeMs: newElapsedBefore,
  };

  return {
    state: pausedState,
    effects: [...tickResult.effects, { type: 'paused' }],
  };
}

/**
 * Resumes a paused session.
 */
function handleResume(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (state.status !== 'paused') {
    return { state, effects: [] };
  }

  const remaining =
    state.phaseDurationMs !== null
      ? Math.max(0, state.phaseDurationMs - state.elapsedBeforeMs)
      : null;
  const endsAt = remaining !== null ? now + remaining : null;

  const resumedState: TimerState = {
    ...state,
    status: 'running',
    segmentStartedAt: now,
  };

  return {
    state: resumedState,
    effects: [{ type: 'resumed', phase: state.phase, endsAt }],
  };
}

/**
 * Stops any active session, immediately marking it finished.
 * Stopwatch completes true; countdown/pomodoro completes false if stopped prematurely.
 */
function handleStop(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (state.status === 'finished') {
    return { state, effects: [] };
  }

  const focusedMs = getFocusedMs(state, now);
  const completed = state.config.mode === 'stopwatch';
  const elapsed = getElapsedMs(state, now);

  const finishedState: TimerState = {
    ...state,
    status: 'finished',
    segmentStartedAt: null,
    elapsedBeforeMs: elapsed,
    focusedMsDone: focusedMs,
    endedAt: now,
    completed,
  };

  return {
    state: finishedState,
    effects: [{ type: 'sessionFinished', focusedMs, completed }],
  };
}

/**
 * Starts the next focus round from awaitingNext.
 */
function handleStartNext(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (state.status !== 'awaitingNext') {
    return { state, effects: [] };
  }

  const nextRound = state.round + 1;
  const endsAt = now + state.config.focusMs;

  const runningState: TimerState = {
    ...state,
    status: 'running',
    phase: 'focus',
    round: nextRound,
    phaseDurationMs: state.config.focusMs,
    segmentStartedAt: now,
    elapsedBeforeMs: 0,
    endedAt: null,
    completed: false,
  };

  return {
    state: runningState,
    effects: [
      {
        type: 'phaseStarted',
        phase: 'focus',
        round: nextRound,
        endsAt,
      },
    ],
  };
}

/**
 * Skips the current break or longBreak.
 */
function handleSkipBreak(
  state: TimerState,
  now: number,
): { state: TimerState; effects: TimerEffect[] } {
  if (
    (state.status !== 'running' && state.status !== 'paused') ||
    (state.phase !== 'break' && state.phase !== 'longBreak')
  ) {
    return { state, effects: [] };
  }

  if (state.phase === 'break') {
    const nextRound = state.round + 1;
    const endsAt = now + state.config.focusMs;

    const nextState: TimerState = {
      ...state,
      status: 'running',
      phase: 'focus',
      round: nextRound,
      phaseDurationMs: state.config.focusMs,
      segmentStartedAt: now,
      elapsedBeforeMs: 0,
    };

    return {
      state: nextState,
      effects: [
        {
          type: 'phaseStarted',
          phase: 'focus',
          round: nextRound,
          endsAt,
        },
      ],
    };
  }

  // longBreak skip -> finishes the session as completed
  const elapsed = getElapsedMs(state, now);
  const finishedState: TimerState = {
    ...state,
    status: 'finished',
    segmentStartedAt: null,
    elapsedBeforeMs: elapsed,
    endedAt: now,
    completed: true,
  };

  return {
    state: finishedState,
    effects: [
      {
        type: 'sessionFinished',
        focusedMs: state.focusedMsDone,
        completed: true,
      },
    ],
  };
}
