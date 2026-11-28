/**
 * Pure decision logic for Do Not Disturb silence transitions in response to timer events.
 * Contains no React Native or native module imports.
 */

export const STOPWATCH_CAP_MS = 12 * 60 * 60 * 1000;

export type SilenceFocusPhase = 'focus' | 'break' | 'longBreak';

export type SilenceFocusEvent =
  | {
      type: 'focus/phaseStarted';
      phase: SilenceFocusPhase;
      endsAt: number | null;
      silence: boolean;
    }
  | {
      type: 'focus/resumed';
      phase: SilenceFocusPhase;
      endsAt: number | null;
      silence: boolean;
    }
  | { type: 'focus/paused' }
  | { type: 'focus/stopped' }
  | { type: 'focus/finished' }
  | { type: 'focus/awaitingNext' };

export interface SilencePlanContext {
  now: number;
}

export type SilencePlan =
  | { action: 'enter'; endsAt: number }
  | { action: 'exit' }
  | { action: 'none' };

/**
 * Computes the next DND action for a given focus lifecycle event.
 */
export function planFor(
  event: SilenceFocusEvent,
  ctx: SilencePlanContext,
): SilencePlan {
  switch (event.type) {
    case 'focus/phaseStarted': {
      if (!event.silence) {
        return { action: 'none' };
      }
      if (event.phase === 'focus') {
        return {
          action: 'enter',
          endsAt: event.endsAt ?? ctx.now + STOPWATCH_CAP_MS,
        };
      }
      // Break / longBreak allows notifications (e.g. card reviews)
      return { action: 'exit' };
    }

    case 'focus/resumed': {
      if (!event.silence || event.phase !== 'focus') {
        return { action: 'none' };
      }
      return {
        action: 'enter',
        endsAt: event.endsAt ?? ctx.now + STOPWATCH_CAP_MS,
      };
    }

    case 'focus/paused':
    case 'focus/stopped':
    case 'focus/finished':
    case 'focus/awaitingNext': {
      return { action: 'exit' };
    }
  }
}
