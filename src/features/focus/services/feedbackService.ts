import { eventBus } from '@/core/events';
import { haptic } from '@/core/feedback';

let unsubscribers: (() => void)[] = [];
let isInitialized = false;

function onPhaseStarted(): void {
  haptic('medium');
}

function onPaused(): void {
  haptic('light');
}

function onResumed(): void {
  haptic('light');
}

function onStopped(): void {
  haptic('light');
}

function onFinished(event: { sessionId: string; focusedSecs: number; completed: boolean }): void {
  if (event.completed) {
    haptic('success');
  }
}

/**
 * Initializes feedback service to trigger haptic feedback on focus session events.
 */
export function initFeedbackService(): void {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  const u1 = eventBus.on('focus/phaseStarted', onPhaseStarted);
  const u2 = eventBus.on('focus/paused', onPaused);
  const u3 = eventBus.on('focus/resumed', onResumed);
  const u4 = eventBus.on('focus/stopped', onStopped);
  const u5 = eventBus.on('focus/finished', onFinished);

  unsubscribers = [u1, u2, u3, u4, u5];
}

/**
 * Destroys event bus listeners (used in testing and teardown).
 */
export function destroyFeedbackService(): void {
  unsubscribers.forEach(u => u());
  unsubscribers = [];
  isInitialized = false;
}

export const feedbackService = {
  init: initFeedbackService,
  destroy: destroyFeedbackService,
};
