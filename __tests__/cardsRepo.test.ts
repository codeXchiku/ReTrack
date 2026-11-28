import type { Db } from '@/core/db';
import { eventBus } from '@/core/events';
import {
  clearAllCards,
  countDue,
  countIntroducedSince,
  countNew,
  countsBySubject,
  createCard,
  deleteCard,
  getCard,
  getCardStats,
  getDueCards,
  getNewCards,
  listBySubject,
  recordReview,
  updateCard,
  type CardRow,
  type Rating,
} from '@/features/cards';

interface ReviewRow {
  id: string;
  card_id: string;
  rating: Rating;
  reviewed_at: number;
  interval_before: number;
  interval_after: number;
}

function createFakeCardsDb(): Db & {
  cards: CardRow[];
  reviews: ReviewRow[];
  failNextReviewInsert: boolean;
} {
  let cards: CardRow[] = [];
  let reviews: ReviewRow[] = [];
  let failNextReviewInsert = false;

  return {
    get cards() {
      return cards;
    },
    get reviews() {
      return reviews;
    },
    get failNextReviewInsert() {
      return failNextReviewInsert;
    },
    set failNextReviewInsert(v: boolean) {
      failNextReviewInsert = v;
    },

    async exec(sql: string, params: unknown[] = []): Promise<void> {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.startsWith('INSERT INTO cards')) {
        const [
          id,
          subject_id,
          front,
          back,
          ease,
          interval_days,
          reps,
          lapses,
          due_at,
          introduced_at,
          last_reviewed_at,
          created_at,
          updated_at,
        ] = params as [
          string,
          string,
          string,
          string,
          number,
          number,
          number,
          number,
          number,
          number | null,
          number | null,
          number,
          number,
        ];
        cards.push({
          id,
          subject_id,
          front,
          back,
          ease,
          interval_days,
          reps,
          lapses,
          due_at,
          introduced_at,
          last_reviewed_at,
          created_at,
          updated_at,
        });
      } else if (
        normalized.startsWith(
          'UPDATE cards SET subject_id = ?, front = ?, back = ?, updated_at = ? WHERE id = ?',
        )
      ) {
        const [subject_id, front, back, updated_at, id] = params as [
          string,
          string,
          string,
          number,
          string,
        ];
        cards = cards.map(c =>
          c.id === id ? { ...c, subject_id, front, back, updated_at } : c,
        );
      } else if (normalized.startsWith('UPDATE cards SET ease = ?')) {
        const [
          ease,
          interval_days,
          reps,
          lapses,
          due_at,
          introduced_at,
          last_reviewed_at,
          updated_at,
          id,
        ] = params as [
          number,
          number,
          number,
          number,
          number,
          number | null,
          number | null,
          number,
          string,
        ];
        cards = cards.map(c =>
          c.id === id
            ? {
                ...c,
                ease,
                interval_days,
                reps,
                lapses,
                due_at,
                introduced_at,
                last_reviewed_at,
                updated_at,
              }
            : c,
        );
      } else if (normalized.startsWith('DELETE FROM cards WHERE id = ?')) {
        const [id] = params as [string];
        cards = cards.filter(c => c.id !== id);
        reviews = reviews.filter(r => r.card_id !== id);
      } else if (normalized.startsWith('DELETE FROM cards')) {
        cards = [];
        reviews = [];
      } else if (normalized.startsWith('INSERT INTO reviews')) {
        if (failNextReviewInsert) {
          failNextReviewInsert = false;
          throw new Error('Simulated review insert failure');
        }
        const [
          id,
          card_id,
          rating,
          reviewed_at,
          interval_before,
          interval_after,
        ] = params as [string, string, Rating, number, number, number];
        reviews.push({
          id,
          card_id,
          rating,
          reviewed_at,
          interval_before,
          interval_after,
        });
      }
    },

    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('WHERE subject_id = ? ORDER BY created_at DESC')) {
        const [subjectId, limit, offset] = params as [string, number, number];
        return cards
          .filter(c => c.subject_id === subjectId)
          .sort((a, b) =>
            b.created_at !== a.created_at
              ? b.created_at - a.created_at
              : a.id.localeCompare(b.id),
          )
          .slice(offset, offset + limit) as unknown as T[];
      }

      if (normalized.includes('GROUP BY subject_id')) {
        const [endOfTodayMs] = params as [number];
        const map = new Map<
          string,
          { subjectId: string; total: number; due: number; newCount: number }
        >();
        for (const c of cards) {
          const entry = map.get(c.subject_id) ?? {
            subjectId: c.subject_id,
            total: 0,
            due: 0,
            newCount: 0,
          };
          entry.total += 1;
          if (c.introduced_at !== null && c.due_at <= endOfTodayMs) {
            entry.due += 1;
          }
          if (c.introduced_at === null) {
            entry.newCount += 1;
          }
          map.set(c.subject_id, entry);
        }
        return Array.from(map.values()) as unknown as T[];
      }

      if (
        normalized.includes(
          'WHERE introduced_at IS NOT NULL AND due_at <= ? ORDER BY due_at ASC',
        )
      ) {
        const [endOfTodayMs, limit] = params as [number, number];
        return cards
          .filter(c => c.introduced_at !== null && c.due_at <= endOfTodayMs)
          .sort((a, b) =>
            a.due_at !== b.due_at
              ? a.due_at - b.due_at
              : a.created_at - b.created_at,
          )
          .slice(0, limit) as unknown as T[];
      }

      if (
        normalized.includes(
          'WHERE introduced_at IS NULL ORDER BY created_at ASC',
        )
      ) {
        const [limit] = params as [number];
        return cards
          .filter(c => c.introduced_at === null)
          .sort((a, b) =>
            a.created_at !== b.created_at
              ? a.created_at - b.created_at
              : a.id.localeCompare(b.id),
          )
          .slice(0, limit) as unknown as T[];
      }

      return [] as T[];
    },

    async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM cards WHERE id = ?')) {
        const [id] = params as [string];
        return (cards.find(c => c.id === id) as unknown as T) ?? null;
      }

      if (
        normalized.startsWith(
          'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NOT NULL AND due_at <= ?',
        )
      ) {
        const [endOfTodayMs] = params as [number];
        const count = cards.filter(
          c => c.introduced_at !== null && c.due_at <= endOfTodayMs,
        ).length;
        return { count } as unknown as T;
      }

      if (
        normalized.startsWith(
          'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NULL',
        )
      ) {
        const count = cards.filter(c => c.introduced_at === null).length;
        return { count } as unknown as T;
      }

      if (
        normalized.startsWith(
          'SELECT COUNT(*) AS count FROM cards WHERE introduced_at IS NOT NULL AND introduced_at >= ?',
        )
      ) {
        const [startOfDayMs] = params as [number];
        const count = cards.filter(
          c => c.introduced_at !== null && c.introduced_at >= startOfDayMs,
        ).length;
        return { count } as unknown as T;
      }

      if (normalized.includes('AS mastered FROM cards')) {
        const [threshold] = params as [number];
        return {
          total: cards.length,
          mastered: cards.filter(c => c.interval_days >= threshold).length,
        } as unknown as T;
      }

      if (
        normalized.startsWith(
          'SELECT COUNT(*) AS reviewedToday FROM reviews WHERE reviewed_at >= ?',
        )
      ) {
        const [startOfDayMs] = params as [number];
        const reviewedToday = reviews.filter(
          r => r.reviewed_at >= startOfDayMs,
        ).length;
        return { reviewedToday } as unknown as T;
      }

      return null;
    },

    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      const cardsSnapshot = cards.map(c => ({ ...c }));
      const reviewsSnapshot = reviews.map(r => ({ ...r }));
      try {
        return await fn(this);
      } catch (err) {
        cards = cardsSnapshot;
        reviews = reviewsSnapshot;
        throw err;
      }
    },
  };
}

describe('cardsRepo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates, gets, lists, updates, and deletes cards while emitting events', async () => {
    const db = createFakeCardsDb();
    const changedSpy = jest.fn();
    const unsub = eventBus.on('cards/changed', changedSpy);

    const createRes = await createCard(
      { subjectId: 'subj-1', front: '  F1  ', back: '  B1  ' },
      1000,
      db,
    );
    expect(createRes.ok).toBe(true);
    if (!createRes.ok) {
      return;
    }

    const card = createRes.value;
    expect(card).toMatchObject({
      subjectId: 'subj-1',
      front: 'F1',
      back: 'B1',
      ease: 2.5,
      intervalDays: 0,
      reps: 0,
      lapses: 0,
      dueAt: 1000,
      introducedAt: null,
      lastReviewedAt: null,
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(changedSpy).toHaveBeenCalledWith({ subjectId: 'subj-1' });

    const fetched = await getCard(card.id, db);
    expect(fetched).toEqual(card);

    // Invalid creation returns error without touching DB
    const badRes = await createCard(
      { subjectId: 'subj-1', front: '   ', back: 'B' },
      1001,
      db,
    );
    expect(badRes).toEqual({ ok: false, error: 'front_empty' });
    expect(db.cards).toHaveLength(1);

    // Update front & subjectId
    const updRes = await updateCard(
      card.id,
      { front: 'F1 updated', subjectId: 'subj-2' },
      2000,
      db,
    );
    expect(updRes.ok).toBe(true);
    if (updRes.ok) {
      expect(updRes.value.front).toBe('F1 updated');
      expect(updRes.value.back).toBe('B1');
      expect(updRes.value.subjectId).toBe('subj-2');
      expect(updRes.value.updatedAt).toBe(2000);
    }

    expect(await listBySubject('subj-1', {}, db)).toEqual([]);
    expect(await listBySubject('subj-2', { limit: 10, offset: 0 }, db)).toHaveLength(1);

    await deleteCard(card.id, db);
    expect(await getCard(card.id, db)).toBeNull();
    unsub();
  });

  it('distinguishes new vs introduced semantics, due ordering, limit, and time boundaries', async () => {
    const db = createFakeCardsDb();
    const startOfToday = new Date(2026, 10, 28, 0, 0, 0, 0).getTime();
    const endOfToday = new Date(2026, 10, 28, 23, 59, 59, 999).getTime();
    const due2359 = new Date(2026, 10, 28, 23, 59, 0, 0).getTime();
    const dueTomorrow0001 = new Date(2026, 10, 29, 0, 1, 0, 0).getTime();

    const cNew = await createCard(
      { subjectId: 's1', front: 'New card', back: 'A' },
      1000,
      db,
    );
    const cDueEarlier = await createCard(
      { subjectId: 's1', front: 'Due earlier', back: 'A' },
      2000,
      db,
    );
    const cDue2359 = await createCard(
      { subjectId: 's1', front: 'Due 23:59', back: 'A' },
      3000,
      db,
    );
    const cTomorrow = await createCard(
      { subjectId: 's2', front: 'Due tomorrow 00:01', back: 'A' },
      4000,
      db,
    );

    if (!cNew.ok || !cDueEarlier.ok || !cDue2359.ok || !cTomorrow.ok) {
      throw new Error('Card setup failed');
    }

    // New cards are NOT counted as due even though due_at <= endOfToday
    expect(await countNew(db)).toBe(4);
    expect(await countDue(endOfToday, db)).toBe(0);

    // Introduce cDue2359 (due 23:59 today)
    await recordReview(
      {
        cardId: cDue2359.value.id,
        rating: 'easy',
        reviewedAt: startOfToday + 1000,
        next: {
          ease: 2.6,
          intervalDays: 1,
          reps: 1,
          lapses: 0,
          dueAt: due2359,
        },
        intervalBefore: 0,
      },
      db,
    );

    // Introduce cDueEarlier (due earlier at 10:00 today)
    await recordReview(
      {
        cardId: cDueEarlier.value.id,
        rating: 'hard',
        reviewedAt: startOfToday + 2000,
        next: {
          ease: 2.3,
          intervalDays: 1,
          reps: 1,
          lapses: 0,
          dueAt: startOfToday + 10 * 3600 * 1000,
        },
        intervalBefore: 0,
      },
      db,
    );

    // Introduce cTomorrow (due 00:01 tomorrow -> NOT due today)
    await recordReview(
      {
        cardId: cTomorrow.value.id,
        rating: 'easy',
        reviewedAt: startOfToday + 3000,
        next: {
          ease: 2.6,
          intervalDays: 1,
          reps: 1,
          lapses: 0,
          dueAt: dueTomorrow0001,
        },
        intervalBefore: 0,
      },
      db,
    );

    expect(await countNew(db)).toBe(1);
    expect(await countDue(endOfToday, db)).toBe(2);
    expect(await countIntroducedSince(startOfToday, db)).toBe(3);

    const newCards = await getNewCards(10, db);
    expect(newCards.map(c => c.id)).toEqual([cNew.value.id]);

    // getDueCards orders earliest due first and respects limit
    const dueOrdered = await getDueCards(endOfToday, 10, db);
    expect(dueOrdered.map(c => c.id)).toEqual([
      cDueEarlier.value.id,
      cDue2359.value.id,
    ]);
    const dueLimited = await getDueCards(endOfToday, 1, db);
    expect(dueLimited.map(c => c.id)).toEqual([cDueEarlier.value.id]);

    // countsBySubject per-subject breakdown
    const counts = await countsBySubject(endOfToday, db);
    expect(counts).toEqual([
      { subjectId: 's1', total: 3, due: 2, new: 1 },
      { subjectId: 's2', total: 1, due: 0, new: 0 },
    ]);
  });

  it('sets introducedAt only on the first review and preserves it on subsequent reviews', async () => {
    const db = createFakeCardsDb();
    const res = await createCard(
      { subjectId: 's1', front: 'Q', back: 'A' },
      1000,
      db,
    );
    if (!res.ok) {
      throw new Error('Failed');
    }

    const firstReviewAt = 5000;
    const secondReviewAt = 90000;

    await recordReview(
      {
        cardId: res.value.id,
        rating: 'easy',
        reviewedAt: firstReviewAt,
        next: { ease: 2.6, intervalDays: 1, reps: 1, lapses: 0, dueAt: 100_000 },
        intervalBefore: 0,
      },
      db,
    );
    const afterFirst = await getCard(res.value.id, db);
    expect(afterFirst?.introducedAt).toBe(firstReviewAt);
    expect(afterFirst?.lastReviewedAt).toBe(firstReviewAt);

    await recordReview(
      {
        cardId: res.value.id,
        rating: 'hard',
        reviewedAt: secondReviewAt,
        next: { ease: 2.5, intervalDays: 3, reps: 2, lapses: 0, dueAt: 300_000 },
        intervalBefore: 1,
      },
      db,
    );
    const afterSecond = await getCard(res.value.id, db);
    expect(afterSecond?.introducedAt).toBe(firstReviewAt);
    expect(afterSecond?.lastReviewedAt).toBe(secondReviewAt);
    expect(afterSecond?.intervalDays).toBe(3);
  });

  it('recordReview is atomic: rolls back card update when review insert fails', async () => {
    const db = createFakeCardsDb();
    const changedSpy = jest.fn();
    const reviewedSpy = jest.fn();
    const unsub1 = eventBus.on('cards/changed', changedSpy);
    const unsub2 = eventBus.on('cards/reviewed', reviewedSpy);

    const res = await createCard(
      { subjectId: 's1', front: 'Atomic Q', back: 'Atomic A' },
      1000,
      db,
    );
    if (!res.ok) {
      throw new Error('Failed');
    }
    changedSpy.mockClear();

    db.failNextReviewInsert = true;
    await expect(
      recordReview(
        {
          cardId: res.value.id,
          rating: 'easy',
          reviewedAt: 5000,
          next: { ease: 2.6, intervalDays: 6, reps: 1, lapses: 0, dueAt: 9999 },
          intervalBefore: 0,
        },
        db,
      ),
    ).rejects.toThrow('Simulated review insert failure');

    // Card row must remain completely untouched
    const card = await getCard(res.value.id, db);
    expect(card).toEqual(res.value);
    expect(db.reviews).toHaveLength(0);
    expect(changedSpy).not.toHaveBeenCalled();
    expect(reviewedSpy).not.toHaveBeenCalled();

    unsub1();
    unsub2();
  });

  it('getCardStats computes total, mastered threshold (20 vs 21 days), and reviewedToday', async () => {
    const db = createFakeCardsDb();
    const startOfToday = 100_000;

    const c20 = await createCard(
      { subjectId: 's1', front: '20d', back: 'A' },
      1000,
      db,
    );
    const c21 = await createCard(
      { subjectId: 's1', front: '21d', back: 'A' },
      2000,
      db,
    );
    if (!c20.ok || !c21.ok) {
      throw new Error('Failed');
    }

    // Yesterday review (interval 20 -> NOT mastered)
    await recordReview(
      {
        cardId: c20.value.id,
        rating: 'easy',
        reviewedAt: startOfToday - 5000,
        next: { ease: 2.6, intervalDays: 20, reps: 3, lapses: 0, dueAt: 500_000 },
        intervalBefore: 10,
      },
      db,
    );

    // Today review (interval 21 -> MASTERED!)
    await recordReview(
      {
        cardId: c21.value.id,
        rating: 'easy',
        reviewedAt: startOfToday + 1000,
        next: { ease: 2.6, intervalDays: 21, reps: 4, lapses: 0, dueAt: 900_000 },
        intervalBefore: 12,
      },
      db,
    );

    const stats = await getCardStats(startOfToday, db);
    expect(stats).toEqual({
      total: 2,
      mastered: 1,
      reviewedToday: 1,
    });

    await clearAllCards(db);
    expect(await getCardStats(startOfToday, db)).toEqual({
      total: 0,
      mastered: 0,
      reviewedToday: 0,
    });
  });
});
