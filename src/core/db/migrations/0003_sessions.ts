import type { Migration } from '../migrate';

/**
 * Migration 0003: creates sessions table with indices on day and subject_id.
 */
export const migration0003: Migration = {
  id: 3,
  name: '0003_sessions',
  up: [
    `CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
      mode TEXT NOT NULL CHECK (mode IN ('countdown','stopwatch','pomodoro')),
      planned_secs INTEGER NOT NULL,
      focused_secs INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      day TEXT NOT NULL,
      finished INTEGER NOT NULL CHECK (finished IN (0,1))
    );`,
    'CREATE INDEX idx_sessions_day ON sessions(day);',
    'CREATE INDEX idx_sessions_subject ON sessions(subject_id);',
  ],
};
