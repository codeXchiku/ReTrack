import type { Migration } from '../migrate';

/**
 * Migration 0002: creates subjects table and case-insensitive unique index on name.
 */
export const migration0002: Migration = {
  id: 2,
  name: '0002_subjects',
  up: [
    `CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );`,
    'CREATE UNIQUE INDEX idx_subjects_name ON subjects(name COLLATE NOCASE);',
  ],
};
