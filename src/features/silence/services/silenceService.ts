import { AppState, type AppStateStatus } from 'react-native';
import { eventBus } from '@/core/events';
import { focusController, getEndsAt } from '@/features/focus';
import {
  planFor,
  STOPWATCH_CAP_MS,
  type SilenceFocusEvent,
} from '../logic/silencePlan';
import { dnd, type DndNativeModule } from '../native/DndModule';
import { useSilenceStore } from '../store/silenceStore';

let activeNative: DndNativeModule = dnd;
let serialQueue: Promise<void> = Promise.resolve();
let unsubscribers: (() => void)[] = [];
let appStateSubscription: { remove: () => void } | null = null;
let isInitialized = false;
let nowFn: () => number = () => Date.now();

/**
 * Enqueues an async operation onto the single serial promise chain
 * so native DND enter/exit/status calls never race.
 */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = serialQueue.then(task, task);
  serialQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function performEnter(endsAt: number): Promise<void> {
  try {
    const result = await activeNative.enter(endsAt);
    switch (result) {
      case 'applied':
        useSilenceStore.getState().setStatus({
          granted: true,
          state: 'active',
          lastError: undefined,
        });
        break;
      case 'already_quiet':
        useSilenceStore.getState().setStatus({
          granted: true,
          state: 'already_quiet',
          lastError: undefined,
        });
        break;
      case 'not_granted':
        useSilenceStore.getState().setStatus({
          granted: false,
          state: 'blocked',
          lastError: undefined,
        });
        break;
      case 'error': {
        const granted = await activeNative.isPolicyAccessGranted().catch(() => false);
        useSilenceStore.getState().setStatus({
          granted,
          state: 'blocked',
          lastError: 'Failed to enable Do Not Disturb',
        });
        break;
      }
    }
  } catch (err) {
    useSilenceStore.getState().setStatus({
      granted: false,
      state: 'blocked',
      lastError: err instanceof Error ? err.message : 'enter_error',
    });
  }
}

async function performExit(): Promise<void> {
  try {
    const result = await activeNative.exit();
    const granted = await activeNative
      .isPolicyAccessGranted()
      .catch(() => useSilenceStore.getState().granted);

    if (result === 'error') {
      useSilenceStore.getState().setStatus({
        granted,
        state: 'blocked',
        lastError: 'Failed to restore Do Not Disturb',
      });
    } else {
      useSilenceStore.getState().setStatus({
        granted,
        state: 'idle',
        lastError: undefined,
      });
    }
  } catch (err) {
    useSilenceStore.getState().setStatus({
      state: 'blocked',
      lastError: err instanceof Error ? err.message : 'exit_error',
    });
  }
}

async function performReconcile(): Promise<void> {
  try {
    const status = await activeNative.getStatus();
    const active = focusController.getActive();
    const shouldSilence =
      active !== null &&
      active.status === 'running' &&
      active.phase === 'focus' &&
      active.config.silence === true;

    if (shouldSilence) {
      if (status.granted) {
        const endsAt = getEndsAt(active) ?? nowFn() + STOPWATCH_CAP_MS;
        await performEnter(endsAt);
      } else {
        if (status.ownedByApp) {
          await activeNative.exit().catch(() => {});
        }
        useSilenceStore.getState().setStatus({
          granted: false,
          state: 'blocked',
          lastError: undefined,
        });
      }
      return;
    }

    if (status.ownedByApp) {
      await performExit();
    } else {
      useSilenceStore.getState().setStatus({
        granted: status.granted,
        state: 'idle',
        lastError: undefined,
      });
    }
  } catch (err) {
    useSilenceStore.getState().setStatus({
      lastError: err instanceof Error ? err.message : 'reconcile_error',
    });
  }
}

function handleFocusEvent(event: SilenceFocusEvent): Promise<void> {
  const plan = planFor(event, { now: nowFn() });
  if (plan.action === 'enter') {
    return enqueue(() => performEnter(plan.endsAt));
  }
  if (plan.action === 'exit') {
    return enqueue(() => performExit());
  }
  return Promise.resolve();
}

/**
 * Refreshes native DND status and reconciles with any active focus session.
 */
export function refreshStatus(): Promise<void> {
  return enqueue(() => performReconcile());
}

/**
 * Initializes event subscriptions, AppState listener, and launch safety net.
 */
export async function init(): Promise<void> {
  if (!isInitialized) {
    isInitialized = true;

    unsubscribers.push(
      eventBus.on('focus/phaseStarted', payload => {
        handleFocusEvent({
          type: 'focus/phaseStarted',
          phase: payload.phase,
          endsAt: payload.endsAt,
          silence: payload.silence,
        }).catch(() => {});
      }),
    );

    unsubscribers.push(
      eventBus.on('focus/resumed', payload => {
        handleFocusEvent({
          type: 'focus/resumed',
          phase: payload.phase,
          endsAt: payload.endsAt,
          silence: payload.silence,
        }).catch(() => {});
      }),
    );

    unsubscribers.push(
      eventBus.on('focus/paused', () => {
        handleFocusEvent({ type: 'focus/paused' }).catch(() => {});
      }),
    );

    unsubscribers.push(
      eventBus.on('focus/stopped', () => {
        handleFocusEvent({ type: 'focus/stopped' }).catch(() => {});
      }),
    );

    unsubscribers.push(
      eventBus.on('focus/finished', () => {
        handleFocusEvent({ type: 'focus/finished' }).catch(() => {});
      }),
    );

    unsubscribers.push(
      eventBus.on('focus/awaitingNext', () => {
        handleFocusEvent({ type: 'focus/awaitingNext' }).catch(() => {});
      }),
    );

    appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          refreshStatus().catch(() => {});
        }
      },
    );
  }

  // Launch safety net: reconcile native ownership with restored focus state
  await refreshStatus();
}

/**
 * Cleans up subscriptions (useful in tests).
 */
export function destroy(): void {
  for (const unsub of unsubscribers) {
    unsub();
  }
  unsubscribers = [];
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  isInitialized = false;
}

export const silenceService = {
  init,
  destroy,
  refreshStatus,
  handleFocusEvent,
  enqueue,
  _setNativeForTest(mock: DndNativeModule) {
    activeNative = mock;
  },
  _setNowForTest(fn: () => number) {
    nowFn = fn;
  },
  _resetForTest() {
    destroy();
    activeNative = dnd;
    nowFn = () => Date.now();
    serialQueue = Promise.resolve();
    useSilenceStore.getState().reset();
  },
};
