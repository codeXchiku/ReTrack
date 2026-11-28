import { type Db, getDb } from '@/core/db';
import { eventBus } from '@/core/events';
import { createId } from '@/core/utils';
import type {
  Card,
  CardRow,
  CardStats,
  RecordReviewInput,
  SubjectCardCounts,
} from '../logic/types';
import {
  type CardValidationError,
  validateCard,
} from '../logic/validateCard';

const CARD_COLUMNS =
  'id, subject_id, front, back, ease, interval_days, reps, lapses, due_at, introduced_at, last_reviewed_at, created_at, updated_at';

export const MASTERED_INTERVAL_DAYS = 21;

export type CardRepoError = CardValidationError | 'not_found';

export type CardResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CardRepoError };

export interface CreateCardInput {
  subjectId: string;
  front: string;
  back: string;
}

export interface UpdateCardInput {
  subjectId?: string;
  front?: string;
  back?: string;
}

export interface ListCardsOptions {
  limit?: number;
  offset?: number;
}

function mapRowToCard(row: CardRow): Card {
  return {
    id: row.id,
    subjectId: row.subject_id,
    front: row.front,
    back: row.back,
    ease: row.ease,
    intervalDays: row.interval_days,
    reps: row.reps,
    lapses: row.lapses,
    dueAt: row.due_at,
    introducedAt: row.introduced_at ?? null,
    lastReviewedAt: row.last_reviewed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches a single card by ID.
 */
export async function getCard(id: string, db?: Db): Promise<Card | null> {
  const database = db ?? getDb();
  const row = await database.queryOne<CardRow>(
    `SELECT ${CARD_COLUMNS} FROM cards WHERE id = ?;`,
    [id],
  );
  return row ? mapRowToCard(row) : null;
}

/**
 * Creates a new flashcard after validating front/back.
 * New cards have introducedAt = null and dueAt = createdAt (= now).
 */
export async function createCard(
  input: CreateCardInput,
  now: number = Date.now(),
  db?: Db,
): Promise<CardResult<Card>> {
  const validation = validateCard({ front: input.front, back: input.back });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const database = db ?? getDb();
  const card: Card = {
    id: createId(),
    subjectId: input.subjectId,
    front: validation.value.front,
    back: validation.value.back,
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: now,
    introducedAt: null,
    lastReviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await database.exec(
    `INSERT INTO cards (${CARD_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      card.id,
      card.subjectId,
      card.front,
      card.back,
      card.ease,
      card.intervalDays,
      card.reps,
      card.lapses,
      card.dueAt,
      card.introducedAt,
      card.lastReviewedAt,
      card.createdAt,
      card.updatedAt,
    ],
  );

  eventBus.emit('cards/changed', { subjectId: card.subjectId });
  return { ok: true, value: card };
}

/**
 * Updates front, back, or subjectId on an existing card.
 */
export async function updateCard(
  id: string,
  patch: UpdateCardInput,
  now: number = Date.now(),
  db?: Db,
): Promise<CardResult<Card>> {
  const database = db ?? getDb();
  const existing = await getCard(id, database);
  if (!existing) {
    return { ok: false, error: 'not_found' };
  }

  const nextFront = patch.front !== undefined ? patch.front : existing.front;
  const nextBack = patch.back !== undefined ? patch.back : existing.back;
  const nextSubjectId =
    patch.subjectId !== undefined ? patch.subjectId : existing.subjectId;

  const validation = validateCard({ front: nextFront, back: nextBack });
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  await database.exec(
    'UPDATE cards SET subject_id = ?, front = ?, back = ?, updated_at = ? WHERE id = ?;',
    [
      nextSubjectId,
      validation.value.front,
      validation.value.back,
      now,
      id,
    ],
  );

  const updated: Card = {
    ...existing,
    subjectId: nextSubjectId,
    front: validation.value.front,
    back: validation.value.back,
    updatedAt: now,
  };

  eventBus.emit('cards/changed', { subjectId: updated.subjectId });
  if (existing.subjectId !== updated.subjectId) {
    eventBus.emit('cards/changed', { subjectId: existing.subjectId });
  }
  return { ok: true, value: updated };
}

/**
 * Deletes a card by ID (cascades to reviews).
 */
export async function deleteCard(id: string, db?: Db): Promise<void> {
  const database = db ?? getDb();
  const existing = await getCard(id, database);
  if (!existing) {
    return;
  }

  await database.exec('DELETE FROM cards WHERE id = ?;', [id]);
  eventBus.emit('cards/changed', { subjectId: existing.subjectId });
}

/**
 * Deletes all cards (primarily for Dev Menu testing).
 */
export async function clearAllCards(db?: Db): Promise<void> {
  const database = db ?? getDb();
  await database.exec('DELETE FROM cards;');
  eventBus.emit('cards/changed', { subjectId: null });
}

/**
 * Lists cards for a subject with limit/offset pagination.
 */
export async function listBySubject(
  subjectId: string,
  options: ListCardsOptions = {},
  db?: Db,
): Promise<Card[]> {
  const database = db ?? getDb();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const rows = await database.query<CardRow>(
    `SELECT ${CARD_COLUMNS} FROM cards WHERE subject_id = ? ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?;`,
    [subjectId, limit, offset],
  );
  return rows.map(mapRowToCard);
}

/**
 * Returns per-subject card counts: total, due (introduced AND due_at <= endOfTodayMs), and new (introduced_at IS NULL).
 */
export async function countsBySubject(
  endOfTodayMs: number,
  db?: Db,
): Promise<SubjectCardCounts[]> {
  const database = db ?? getDb();
  const rows = await database.query<{
    subjectId: string;
    total: number;
    due: number;
    newCount: number;
  }>(
    `SELECT
       subject_id AS subjectId,
       COUNT(*) AS total,
       SUM(CASE WHEN introduced_at IS NOT NULL AND due_at <= ? THEN 1 ELSE 0 END) AS due,
       SUM(CASE WHEN introduced_at IS NULL THEN 1 ELSE 0 END) AS newCount
     FROM cards
     GROUP BY subject_id;`,
    [endOfTodayMs],
  );

  return rows.map(r => ({
    subjectId: r.subjectId,
    total: Number(r.total ?? 0),
    due: Number(r.due ?? 0),
    new: Number(r.newCount ?? 0),
  }));
}

/**
 * Returns introduced cards due on or before endOfTodayMs, ordered earliest due first.
 */
export async function getDueCards(
  endOfTodayMs: number,
  limit: number = 100,
  db?: Db,
): Promise<Card[]> {
  const database = db ?? getDb();
  const rows = await database.query<CardRow>(
    `SELECT ${CARD_COLUMNS} FROM cards
     WHERE introduced_at IS NOT NULL AND due_at <= ?
     ORDER BY due_at ASC, created_at ASC
     LIMIT ?;`,
    [endOfTodayMs, limit],
  );
  return rows.map(mapRowToCard);
}

/**
 * Returns unintroduced (new) cards ordered oldest created first.
 */
export async function getNewCards(
  limit: number = 50,
  db?: Db,
): Promise<Card[]> {
  const database = db ?? getDb();
  const rows = await database.query<CardRow>(
    `SELECT ${CARD_COLUMNS} FROM cards
     WHERE introduced_at IS NULL
     ORDER BY created_at ASC, id ASC
     LIMIT ?;`,
    [limit],
  );
  return rows.map(mapRowToCard);
}

/**
 * Counts introduced cards due on or before endOfTodayMs.
 */
export async function countDue(
  endOfTodayMs: number,
  db?: Db,
): Promise<number> {
  const database = db ?? getDb();
  const row = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NOT NULL AND due_at <= ?;',
    [endOfTodayMs],
  );
  return Number(row?.count ?? 0);
}

/**
 * Counts unintroduced (new) cards.
 */
export async function countNew(db?: Db): Promise<number> {
  const database = db ?? getDb();
  const row = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NULL;',
  );
  return Number(row?.count ?? 0);
}

/**
 * Counts cards introduced since startOfDayMs.
 */
export async function countIntroducedSince(
  startOfDayMs: number,
  db?: Db,
): Promise<number> {
  const database = db ?? getDb();
  const row = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NOT NULL AND introduced_at >= ?;',
    [startOfDayMs],
  );
  return Number(row?.count ?? 0);
}

/**
 * Atomically updates a card's scheduling state (setting introduced_at only if previously null)
 * and appends a review history row inside one database transaction.
 */
export async function recordReview(
  input: RecordReviewInput,
  db?: Db,
): Promise<Card> {
  const database = db ?? getDb();

  const updated = await database.transaction(async tx => {
    const existingRow = await tx.queryOne<CardRow>(
      `SELECT ${CARD_COLUMNS} FROM cards WHERE id = ?;`,
      [input.cardId],
    );
    if (!existingRow) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const introducedAt = existingRow.introduced_at ?? input.reviewedAt;
    const { ease, intervalDays, reps, lapses, dueAt } = input.next;

    await tx.exec(
      `UPDATE cards
       SET ease = ?, interval_days = ?, reps = ?, lapses = ?, due_at = ?,
           introduced_at = ?, last_reviewed_at = ?, updated_at = ?
       WHERE id = ?;`,
      [
        ease,
        intervalDays,
        reps,
        lapses,
        dueAt,
        introducedAt,
        input.reviewedAt,
        input.reviewedAt,
        input.cardId,
      ],
    );

    await tx.exec(
      `INSERT INTO reviews (id, card_id, rating, reviewed_at, interval_before, interval_after)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        createId(),
        input.cardId,
        input.rating,
        input.reviewedAt,
        input.intervalBefore,
        intervalDays,
      ],
    );

    return {
      ...mapRowToCard(existingRow),
      ease,
      intervalDays,
      reps,
      lapses,
      dueAt,
      introducedAt,
      lastReviewedAt: input.reviewedAt,
      updatedAt: input.reviewedAt,
    };
  });

  eventBus.emit('cards/changed', { subjectId: updated.subjectId });
  eventBus.emit('cards/reviewed', {
    cardId: input.cardId,
    rating: input.rating,
  });

  return updated;
}

/**
 * Returns aggregate card statistics: total cards, mastered (intervalDays >= 21),
 * and reviews recorded since startOfDayMs.
 */
export async function getCardStats(
  startOfDayMs: number,
  db?: Db,
): Promise<CardStats> {
  const database = db ?? getDb();

  const cardAgg = await database.queryOne<{
    total: number;
    mastered: number;
  }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN interval_days >= ? THEN 1 ELSE 0 END) AS mastered
     FROM cards;`,
    [MASTERED_INTERVAL_DAYS],
  );

  const reviewAgg = await database.queryOne<{ reviewedToday: number }>(
    'SELECT COUNT(*) AS reviewedToday FROM reviews WHERE reviewed_at >= ?;',
    [startOfDayMs],
  );

  return {
    total: Number(cardAgg?.total ?? 0),
    mastered: Number(cardAgg?.mastered ?? 0),
    reviewedToday: Number(reviewAgg?.reviewedToday ?? 0),
  };
}
