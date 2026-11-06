/**
 * Generates a unique, URL-safe ID using base36 timestamp + random string.
 */
export function createId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${random}`;
}

