import type { Migration } from '../migrate';

/**
 * Migration 0005: creates reviews table with indices on card_id and reviewed_at.
 */
export const migration0005: Migration = {
  id: 5,
  name: '0005_reviews',
  up: [
    `CREATE TABLE reviews (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      rating TEXT NOT NULL CHECK (rating IN ('forgot','hard','easy')),
      reviewed_at INTEGER NOT NULL,
      interval_before INTEGER NOT NULL,
      interval_after INTEGER NOT NULL
    );`,
    'CREATE INDEX idx_reviews_card ON reviews(card_id);',
    'CREATE INDEX idx_reviews_time ON reviews(reviewed_at);',
  ],
};
