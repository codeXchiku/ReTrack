import type { Migration } from '../migrate';

/**
 * Migration 0004: creates cards table with indices on due_at and subject_id.
 */
export const migration0004: Migration = {
  id: 4,
  name: '0004_cards',
  up: [
    `CREATE TABLE cards (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      due_at INTEGER NOT NULL,
      introduced_at INTEGER,
      last_reviewed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`,
    'CREATE INDEX idx_cards_due ON cards(due_at);',
    'CREATE INDEX idx_cards_subject ON cards(subject_id);',
  ],
};
