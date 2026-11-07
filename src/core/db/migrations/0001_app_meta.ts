import type { Migration } from '../migrate';

/**
 * Migration 0001: creates app_meta table and stores initial db_created_at timestamp.
 */
export const migration0001: Migration = {
  id: 1,
  name: '0001_app_meta',
  up: [
    'CREATE TABLE app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
    "INSERT INTO app_meta (key, value) VALUES ('db_created_at', strftime('%s','now') * 1000);",
  ],
};

