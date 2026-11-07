import { log } from '@/core/utils/log';
import type { AppEvents } from './events';

type Handler<T> = (payload: T) => void;

const listeners = new Map<keyof AppEvents, Set<Handler<never>>>();

/**
 * Resets all listeners (primarily for tests).
 */
export function clearEventBus(): void {
  listeners.clear();
}

/**
 * Subscribes a handler to an event. Returns an unsubscribe function.
 */
export function on<E extends keyof AppEvents>(
  event: E,
  handler: Handler<AppEvents[E]>,
): () => void {
  let handlers = listeners.get(event);
  if (!handlers) {
    handlers = new Set();
    listeners.set(event, handlers);
  }
  handlers.add(handler as Handler<never>);

  return () => {
    off(event, handler);
  };
}

/**
 * Unsubscribes a handler from an event.
 */
export function off<E extends keyof AppEvents>(
  event: E,
  handler: Handler<AppEvents[E]>,
): void {
  const handlers = listeners.get(event);
  if (handlers) {
    handlers.delete(handler as Handler<never>);
    if (handlers.size === 0) {
      listeners.delete(event);
    }
  }
}

/**
 * Emits an event with its payload. Handlers that throw will not interrupt others.
 */
export function emit<E extends keyof AppEvents>(
  event: E,
  payload: AppEvents[E],
): void {
  const handlers = listeners.get(event);
  if (!handlers || handlers.size === 0) {
    return;
  }

  // Iterate over a snapshot so subscriptions/unsubscriptions during emit don't interfere
  const snapshot = Array.from(handlers);
  for (const handler of snapshot) {
    try {
      handler(payload as never);
    } catch (err) {
      log.error(`[EventBus] Error in handler for event "${String(event)}":`, err);
    }
  }
}

export const eventBus = {
  emit,
  on,
  off,
  clear: clearEventBus,
};
