import type { Migration } from '../migrate';
import { migration0001 } from './0001_app_meta';
import { migration0002 } from './0002_subjects';
import { migration0003 } from './0003_sessions';

export * from './0001_app_meta';
export * from './0002_subjects';
export * from './0003_sessions';

/**
 * Ordered list of all database migrations.
 */
export const migrations: Migration[] = [
  migration0001,
  migration0002,
  migration0003,
];

export function getMigrations(): Migration[] {
  return [migration0001, migration0002, migration0003];
}
