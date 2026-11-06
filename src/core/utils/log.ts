/* eslint-disable no-console */
/**
 * Application logger that remains silent in production/release mode (!__DEV__).
 */
export const log = {
  debug(...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.debug(...args);
    }
  },
  info(...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.info(...args);
    }
  },
  warn(...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(...args);
    }
  },
  error(...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(...args);
    }
  },
};

