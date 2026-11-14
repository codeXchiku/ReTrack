import { AppState, type AppStateStatus } from 'react-native';
import { eventBus } from '@/core/events';
import { createSetting, getJSON, remove, setJSON } from '@/core/storage';
import { type Clock, systemClock } from '@/core/time';
import { createId } from '@/core/utils';
import { saveSession as realSaveSession } from '@/features/sessions';
import { applyAction, startSession } from '../logic/engine';
import {
  type ConfigValidationError,
  validateConfig,
} from '../logic/presets';
import { getEndsAt } from '../logic/selectors';
import type {
  TimerAction,
  TimerConfig,
  TimerEffect,
  TimerState,
} from '../logic/types';
import { type FocusResult, useFocusStore } from '../store/focusStore';
import { ensureNotificationPermission } from './notificationService';

const ACTIVE_STATE_KEY = 'focus.activeState';

export const lastConfigSetting = createSetting<TimerConfig | null>(
  'focus.lastConfig',
  null,
);

export type StartFocusError =
  | 'already_active'
  | 'no_last_config'
  | ConfigValidationError;

export type StartFocusResult =
  | { ok: true; state: TimerState }
  | { ok: false; error: StartFocusError };

export interface StartFocusOptions {
  now?: number;
  skipValidation?: boolean;
}

export interface FocusStorage {
  getJSON<T>(key: string): T | undefined;
  setJSON<T>(key: string, value: T): void;
  remove(key: string): void;
}

const defaultStorage: FocusStorage = {
  getJSON: key => getJSON(key),
  setJSON: (key, val) => setJSON(key, val),
  remove: key => remove(key),
};

let activeClock: Clock = systemClock;
let activeStorage: FocusStorage = defaultStorage;
let activeSaveSession = realSaveSession;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

function isValidTimerState(obj: unknown): obj is TimerState {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;
  if (typeof o.sessionId !== 'string' || !o.sessionId) {
    return false;
  }
  if (!o.config || typeof o.config !== 'object') {
    return false;
  }
  const c = o.config as Record<string, unknown>;
  if (
    c.mode !== 'countdown' &&
    c.mode !== 'stopwatch' &&
    c.mode !== 'pomodoro'
  ) {
    return false;
  }
  if (typeof c.focusMs !== 'number' || typeof c.breakMs !== 'number') {
    return false;
  }
  if (typeof c.rounds !== 'number') {
    return false;
  }
  if (typeof o.round !== 'number' || o.round < 1) {
    return false;
  }
  if (
    o.status !== 'running' &&
    o.status !== 'paused' &&
    o.status !== 'awaitingNext' &&
    o.status !== 'finished'
  ) {
    return false;
  }
  if (o.phase !== 'focus' && o.phase !== 'break' && o.phase !== 'longBreak') {
    return false;
  }
  if (typeof o.startedAt !== 'number') {
    return false;
  }
  if (typeof o.elapsedBeforeMs !== 'number') {
    return false;
  }
  if (typeof o.focusedMsDone !== 'number') {
    return false;
  }
  return true;
}

function startForegroundTicker(): void {
  if (tickTimer) {
    return;
  }
  tickTimer = setInterval(() => {
    const active = useFocusStore.getState().active;
    if (active && active.status === 'running') {
      tick().catch(() => {});
    } else {
      stopForegroundTicker();
    }
  }, 1000);
}

function stopForegroundTicker(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function setupAppStateListener(): void {
  if (appStateSubscription) {
    return;
  }
  appStateSubscription = AppState.addEventListener(
    'change',
    (state: AppStateStatus) => {
      const active = useFocusStore.getState().active;
      if (state === 'active') {
        if (active && active.status === 'running') {
          tick().catch(() => {});
          startForegroundTicker();
        }
      } else {
        stopForegroundTicker();
      }
    },
  );
}

async function dispatchEffects(
  state: TimerState,
  effects: TimerEffect[],
  now: number,
): Promise<void> {
  for (const effect of effects) {
    switch (effect.type) {
      case 'phaseStarted':
        eventBus.emit('focus/phaseStarted', {
          sessionId: state.sessionId,
          phase: effect.phase,
          endsAt: effect.endsAt,
          silence: state.config.silence,
        });
        break;

      case 'paused':
        eventBus.emit('focus/paused', {
          sessionId: state.sessionId,
        });
        break;

      case 'resumed':
        eventBus.emit('focus/resumed', {
          sessionId: state.sessionId,
          phase: effect.phase,
          endsAt: effect.endsAt,
          silence: state.config.silence,
        });
        break;

      case 'awaitingNext':
        eventBus.emit('focus/awaitingNext', {
          sessionId: state.sessionId,
          nextRound: effect.nextRound,
        });
        break;

      case 'sessionFinished': {
        stopForegroundTicker();
        activeStorage.remove(ACTIVE_STATE_KEY);

        const focusedSecs = Math.floor(effect.focusedMs / 1000);
        let saveRes = {
          saved: false,
          streakBefore: 0,
          streakAfter: 0,
        };

        try {
          saveRes = await activeSaveSession(
            {
              id: state.sessionId,
              subjectId: state.config.subjectId,
              mode: state.config.mode,
              focusMs: state.config.focusMs,
              rounds: state.config.rounds,
              focusedMs: effect.focusedMs,
              startedAt: state.startedAt,
              endedAt: now,
              completed: effect.completed,
            },
            { now },
          );
        } catch {
          // If database or session saving fails, do not crash focus flow
        }

        const lastResult: FocusResult = {
          sessionId: state.sessionId,
          subjectId: state.config.subjectId,
          mode: state.config.mode,
          focusedSecs,
          rounds: state.round,
          completed: effect.completed,
          saved: saveRes.saved,
          streakBefore: saveRes.streakBefore,
          streakAfter: saveRes.streakAfter,
          endedAt: now,
        };

        useFocusStore.setState({
          active: null,
          lastResult,
        });

        eventBus.emit('focus/finished', {
          sessionId: state.sessionId,
          focusedSecs,
          completed: effect.completed,
        });
        break;
      }
    }
  }
}

async function executeAction(action: TimerAction, customNow?: number): Promise<TimerState | null> {
  const current = useFocusStore.getState().active;
  if (!current) {
    return null;
  }

  const now = customNow ?? activeClock.now();
  const { state: nextState, effects } = applyAction(current, action, now);

  if (nextState.status !== 'finished') {
    useFocusStore.setState({ active: nextState });
    activeStorage.setJSON(ACTIVE_STATE_KEY, nextState);
    if (nextState.status === 'running') {
      startForegroundTicker();
    } else {
      stopForegroundTicker();
    }
  }

  await dispatchEffects(nextState, effects, now);
  return nextState;
}

export function start(
  config: TimerConfig,
  options: StartFocusOptions = {},
): StartFocusResult {
  const current = useFocusStore.getState().active;
  if (current !== null && current.status !== 'finished') {
    return { ok: false, error: 'already_active' };
  }

  if (!options.skipValidation) {
    const val = validateConfig(config);
    if (!val.ok) {
      return { ok: false, error: val.error };
    }
  }

  // Request notification permission on first session start; runs without blocking
  ensureNotificationPermission().catch(() => {});

  setupAppStateListener();
  const now = options.now ?? activeClock.now();
  const sessionId = createId();
  const { state, effects } = startSession(config, now, sessionId);

  useFocusStore.setState({ active: state });
  activeStorage.setJSON(ACTIVE_STATE_KEY, state);
  lastConfigSetting.set(config);

  startForegroundTicker();
  dispatchEffects(state, effects, now).catch(() => {});

  return { ok: true, state };
}

export async function pause(now?: number): Promise<void> {
  await executeAction({ type: 'pause' }, now);
}

export async function resume(now?: number): Promise<void> {
  await executeAction({ type: 'resume' }, now);
}

export async function stop(now?: number): Promise<void> {
  const current = useFocusStore.getState().active;
  if (!current) {
    return;
  }
  eventBus.emit('focus/stopped', { sessionId: current.sessionId });
  await executeAction({ type: 'stop' }, now);
}

export async function startNext(now?: number): Promise<void> {
  await executeAction({ type: 'startNext' }, now);
}

export async function skipBreak(now?: number): Promise<void> {
  await executeAction({ type: 'skipBreak' }, now);
}

export async function tick(now?: number): Promise<TimerState | null> {
  return executeAction({ type: 'tick' }, now);
}

export function dismissResult(): void {
  useFocusStore.setState({ lastResult: null });
}

export function getActive(): TimerState | null {
  return useFocusStore.getState().active;
}

export function getLastConfig(): TimerConfig | null {
  return lastConfigSetting.get();
}

export function startLast(options: StartFocusOptions = {}): StartFocusResult {
  const current = useFocusStore.getState().active;
  if (current !== null && current.status !== 'finished') {
    return { ok: false, error: 'already_active' };
  }

  const last = getLastConfig();
  if (!last) {
    return { ok: false, error: 'no_last_config' };
  }

  return start(last, options);
}

export async function restore(customNow?: number): Promise<TimerState | null> {
  setupAppStateListener();
  const raw = activeStorage.getJSON<unknown>(ACTIVE_STATE_KEY);
  if (!raw) {
    useFocusStore.setState({ hydrated: true });
    return null;
  }

  if (!isValidTimerState(raw)) {
    activeStorage.remove(ACTIVE_STATE_KEY);
    useFocusStore.setState({ hydrated: true });
    return null;
  }

  const now = customNow ?? activeClock.now();
  if (raw.status === 'finished') {
    activeStorage.remove(ACTIVE_STATE_KEY);
    useFocusStore.setState({ hydrated: true });
    return null;
  }

  if (raw.status === 'paused' || raw.status === 'awaitingNext') {
    useFocusStore.setState({ active: raw, hydrated: true });
    return raw;
  }

  // Running state: apply tick with current time
  const { state: nextState, effects } = applyAction(
    raw,
    { type: 'tick' },
    now,
  );

  if (nextState.status === 'finished') {
    await dispatchEffects(nextState, effects, now);
    useFocusStore.setState({ hydrated: true });
    return null;
  }

  useFocusStore.setState({ active: nextState, hydrated: true });
  activeStorage.setJSON(ACTIVE_STATE_KEY, nextState);
  startForegroundTicker();

  // Re-emit phaseStarted or resumed once so Silence can re-enter state
  const hasPhaseStartedEffect = effects.some(e => e.type === 'phaseStarted');
  if (!hasPhaseStartedEffect) {
    eventBus.emit('focus/phaseStarted', {
      sessionId: nextState.sessionId,
      phase: nextState.phase,
      endsAt: getEndsAt(nextState),
      silence: nextState.config.silence,
    });
  }

  await dispatchEffects(nextState, effects, now);
  return nextState;
}

// Controller test helpers and dependency injection
export const focusController = {
  start,
  pause,
  resume,
  stop,
  startNext,
  skipBreak,
  tick,
  dismissResult,
  restore,
  getActive,
  getLastConfig,
  startLast,

  setClock(clock: Clock) {
    activeClock = clock;
  },
  getClock(): Clock {
    return activeClock;
  },
  setStorage(storage: FocusStorage) {
    activeStorage = storage;
  },
  setSaveSession(fn: typeof realSaveSession) {
    activeSaveSession = fn;
  },
  _resetForTest() {
    stopForegroundTicker();
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    activeClock = systemClock;
    activeStorage = defaultStorage;
    activeSaveSession = realSaveSession;
    useFocusStore.getState().reset();
  },
};
