/**
 * Asserts a condition, throwing an Error if falsy.
 */
export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(msg);
  }
}

