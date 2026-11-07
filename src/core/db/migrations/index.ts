import type { Migration } from '../migrate';
import { migration0001 } from './0001_app_meta';

export * from './0001_app_meta';

/**
 * Ordered list of all database migrations.
 */
export const migrations: Migration[] = [migration0001];

export function getMigrations(): Migration[] {
  return [migration0001];
}
