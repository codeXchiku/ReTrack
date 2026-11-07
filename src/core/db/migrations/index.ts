import type { Migration } from '../migrate';
import { migration0001 } from './0001_app_meta';
import { migration0002 } from './0002_subjects';

export * from './0001_app_meta';
export * from './0002_subjects';

/**
 * Ordered list of all database migrations.
 */
export const migrations: Migration[] = [migration0001, migration0002];

export function getMigrations(): Migration[] {
  return [migration0001, migration0002];
}
