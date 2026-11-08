import type { Db } from '@/core/db';
import { eventBus } from '@/core/events';
import {
  buildSessionRow,
  clearSessions,
  computeStreaks,
  getDailyTotals,
  getSessionCount,
  getSubjectTotals,
  getTotalFocusedSecs,
  insertSession,
  saveSession,
  type SessionMode,
  type SessionRow,
  shouldSaveSession,
  STREAK_MIN_SECS,
} from '@/features/sessions';

class FakeDb implements Db {
  rows: SessionRow[] = [];

  async exec(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.includes('INSERT OR IGNORE')) {
      const [
        id,
        subject_id,
        mode,
        planned_secs,
        focused_secs,
        started_at,
        ended_at,
        day,
        finished,
      ] = params as [
        string,
        string | null,
        SessionMode,
        number,
        number,
        number,
        number,
        string,
        number,
      ];
      if (!this.rows.some(r => r.id === id)) {
        this.rows.push({
          id,
          subject_id,
          mode,
          planned_secs,
          focused_secs,
          started_at,
          ended_at,
          day,
          finished,
        });
      }
    } else if (sql.includes('DELETE FROM sessions')) {
      this.rows = [];
    }
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (
      sql.includes('WHERE day >= ? AND day <= ?') &&
      sql.includes('GROUP BY day')
    ) {
      const [fromDay, toDay] = params as [string, string];
      const map: Record<string, number> = {};
      for (const r of this.rows) {
        if (r.day >= fromDay && r.day <= toDay) {
          map[r.day] = (map[r.day] ?? 0) + r.focused_secs;
        }
      }
      return Object.entries(map).map(
        ([day, total_secs]) => ({ day, total_secs } as unknown as T),
      );
    }

    if (sql.includes('GROUP BY day')) {
      const map: Record<string, number> = {};
      for (const r of this.rows) {
        map[r.day] = (map[r.day] ?? 0) + r.focused_secs;
      }
      return Object.entries(map).map(
        ([day, total_secs]) => ({ day, total_secs } as unknown as T),
      );
    }

    if (sql.includes('GROUP BY subject_id')) {
      const [fromDay, toDay] = params as [string, string];
      const map = new Map<string | null, number>();
      for (const r of this.rows) {
        if (r.day >= fromDay && r.day <= toDay) {
          map.set(r.subject_id, (map.get(r.subject_id) ?? 0) + r.focused_secs);
        }
      }
      const arr = Array.from(map.entries()).map(([subjectId, secs]) => ({
        subjectId,
        secs,
      }));
      arr.sort((a, b) => b.secs - a.secs);
      return arr as unknown as T[];
    }

    return [] as T[];
  }

  async queryOne<T>(sql: string): Promise<T | null> {
    if (sql.includes('SUM(focused_secs)')) {
      const total = this.rows.reduce((sum, r) => sum + r.focused_secs, 0);
      return { total } as unknown as T;
    }
    if (sql.includes('COUNT(*)')) {
      return { count: this.rows.length } as unknown as T;
    }
    return null;
  }
}

describe('Sessions Feature', () => {
  // Test 1: computeStreaks table tests
  describe('1. computeStreaks', () => {
    const streakCases: {
      name: string;
      totals: Record<string, number>;
      today: string;
      expected: { current: number; best: number; todayQualified: boolean };
    }[] = [
      {
        name: 'empty data',
        totals: {},
        today: '2026-05-10',
        expected: { current: 0, best: 0, todayQualified: false },
      },
      {
        name: 'only today >= 10m',
        totals: { '2026-05-10': 600 },
        today: '2026-05-10',
        expected: { current: 1, best: 1, todayQualified: true },
      },
      {
        name: 'today 9m59s (599s) with 3-day run ending yesterday',
        totals: {
          '2026-05-07': 700,
          '2026-05-08': 600,
          '2026-05-09': 900,
          '2026-05-10': 599,
        },
        today: '2026-05-10',
        expected: { current: 3, best: 3, todayQualified: false },
      },
      {
        name: 'gap breaks the run (missing yesterday)',
        totals: {
          '2026-05-07': 600,
          '2026-05-08': 800,
          // 2026-05-09 missing
          '2026-05-10': 100, // not qualified
        },
        today: '2026-05-10',
        expected: { current: 0, best: 2, todayQualified: false },
      },
      {
        name: 'best > current',
        totals: {
          // 5-day streak in April
          '2026-04-01': 600,
          '2026-04-02': 600,
          '2026-04-03': 600,
          '2026-04-04': 600,
          '2026-04-05': 600,
          // yesterday only
          '2026-05-09': 600,
        },
        today: '2026-05-10',
        expected: { current: 1, best: 5, todayQualified: false },
      },
      {
        name: 'month and year boundary (2025-12-31 to 2026-01-02)',
        totals: {
          '2025-12-31': 600,
          '2026-01-01': 600,
          '2026-01-02': 600,
        },
        today: '2026-01-02',
        expected: { current: 3, best: 3, todayQualified: true },
      },
      {
        name: 'boundary check: 600 qualifies, 599 does not',
        totals: {
          '2026-05-09': 600,
          '2026-05-10': 599,
        },
        today: '2026-05-10',
        expected: { current: 1, best: 1, todayQualified: false },
      },
      {
        name: 'multiple far-apart runs (4 days, gap, 2 days)',
        totals: {
          '2026-03-01': 600,
          '2026-03-02': 600,
          '2026-03-03': 600,
          '2026-03-04': 600, // 4-day run

          '2026-04-10': 600,
          '2026-04-11': 600, // 2-day run
        },
        today: '2026-04-15',
        expected: { current: 0, best: 4, todayQualified: false },
      },
    ];

    test.each(streakCases)('$name', ({ totals, today, expected }) => {
      const result = computeStreaks(totals, today, STREAK_MIN_SECS);
      expect(result).toEqual(expected);
    });
  });

  // Test 2: shouldSaveSession
  describe('2. shouldSaveSession', () => {
    test('rejects under 30s and accepts >= 30s', () => {
      expect(shouldSaveSession(0)).toBe(false);
      expect(shouldSaveSession(29)).toBe(false);
      expect(shouldSaveSession(30)).toBe(true);
      expect(shouldSaveSession(31)).toBe(true);
      expect(shouldSaveSession(Number.NaN)).toBe(false);
    });
  });

  // Test 3: Repo methods with FakeDb
  describe('3. Sessions Repository with Db', () => {
    let fakeDb: FakeDb;

    beforeEach(() => {
      fakeDb = new FakeDb();
    });

    test('insertSession is idempotent (INSERT OR IGNORE)', async () => {
      const row = buildSessionRow(
        {
          id: 'session-1',
          subjectId: 'sub-1',
          mode: 'countdown',
          focusedSecs: 900,
          startedAt: 1000,
          endedAt: 2000,
          completed: true,
        },
        2000,
      );

      await insertSession(row, fakeDb);
      await insertSession(row, fakeDb); // duplicate insert

      expect(await getSessionCount(fakeDb)).toBe(1);
      expect(await getTotalFocusedSecs(fakeDb)).toBe(900);
    });

    test('getDailyTotals sums multiple sessions and filters date range', async () => {
      const r1 = buildSessionRow(
        {
          id: 's1',
          subjectId: 'sub-1',
          mode: 'countdown',
          focusedSecs: 500,
          startedAt: 1000,
          endedAt: 2000,
        },
        2000,
      ); // day: derived from endedAt
      r1.day = '2026-05-01';

      const r2 = buildSessionRow(
        {
          id: 's2',
          subjectId: 'sub-2',
          mode: 'pomodoro',
          focusedSecs: 400,
          startedAt: 3000,
          endedAt: 4000,
        },
        4000,
      );
      r2.day = '2026-05-01'; // same day

      const r3 = buildSessionRow(
        {
          id: 's3',
          subjectId: null,
          mode: 'stopwatch',
          focusedSecs: 300,
          startedAt: 5000,
          endedAt: 6000,
        },
        6000,
      );
      r3.day = '2026-05-02';

      const rOutside = buildSessionRow(
        {
          id: 's4',
          subjectId: null,
          mode: 'stopwatch',
          focusedSecs: 200,
          startedAt: 7000,
          endedAt: 8000,
        },
        8000,
      );
      rOutside.day = '2026-05-15'; // outside range

      await insertSession(r1, fakeDb);
      await insertSession(r2, fakeDb);
      await insertSession(r3, fakeDb);
      await insertSession(rOutside, fakeDb);

      const totals = await getDailyTotals('2026-05-01', '2026-05-02', fakeDb);
      expect(totals).toEqual({
        '2026-05-01': 900,
        '2026-05-02': 300,
      });

      // All daily totals without params
      const allTotals = await getDailyTotals(undefined, undefined, fakeDb);
      expect(allTotals['2026-05-15']).toBe(200);
    });

    test('getSubjectTotals groups null subject and sorts descending', async () => {
      const r1 = buildSessionRow(
        {
          id: 's1',
          subjectId: 'sub-a',
          mode: 'countdown',
          focusedSecs: 300,
          startedAt: 1000,
        },
        1000,
      );
      r1.day = '2026-05-01';

      const r2 = buildSessionRow(
        {
          id: 's2',
          subjectId: null,
          mode: 'countdown',
          focusedSecs: 800,
          startedAt: 2000,
        },
        2000,
      );
      r2.day = '2026-05-01';

      const r3 = buildSessionRow(
        {
          id: 's3',
          subjectId: 'sub-b',
          mode: 'countdown',
          focusedSecs: 500,
          startedAt: 3000,
        },
        3000,
      );
      r3.day = '2026-05-01';

      await insertSession(r1, fakeDb);
      await insertSession(r2, fakeDb);
      await insertSession(r3, fakeDb);

      const subTotals = await getSubjectTotals('2026-05-01', '2026-05-01', fakeDb);
      expect(subTotals).toEqual([
        { subjectId: null, secs: 800 },
        { subjectId: 'sub-b', secs: 500 },
        { subjectId: 'sub-a', secs: 300 },
      ]);
    });

    test('clearSessions removes all sessions', async () => {
      const r1 = buildSessionRow(
        { id: 's1', subjectId: null, mode: 'countdown', focusedSecs: 300, startedAt: 1000 },
        1000,
      );
      await insertSession(r1, fakeDb);
      expect(await getSessionCount(fakeDb)).toBe(1);

      await clearSessions(fakeDb);
      expect(await getSessionCount(fakeDb)).toBe(0);
      expect(await getTotalFocusedSecs(fakeDb)).toBe(0);
    });
  });

  // Test 4: saveSession
  describe('4. saveSession', () => {
    let fakeDb: FakeDb;
    let emitSpy: jest.SpyInstance;

    beforeEach(() => {
      fakeDb = new FakeDb();
      emitSpy = jest.spyOn(eventBus, 'emit');
    });

    afterEach(() => {
      emitSpy.mockRestore();
    });

    test('returns streakBefore and streakAfter correctly on threshold crossing and emits event', async () => {
      const todayMs = new Date('2026-05-10T12:00:00Z').getTime();

      // Yesterday had a qualifying session (600s)
      const yesterdayRow = buildSessionRow(
        {
          id: 'yesterday-session',
          subjectId: null,
          mode: 'countdown',
          focusedSecs: 600,
          startedAt: todayMs - 24 * 3600 * 1000,
          endedAt: todayMs - 24 * 3600 * 1000,
        },
        todayMs - 24 * 3600 * 1000,
      );
      yesterdayRow.day = '2026-05-09';
      await insertSession(yesterdayRow, fakeDb);

      // Today has 500s (< 600s, not qualified yet)
      const todayEarlier = buildSessionRow(
        {
          id: 'earlier-session',
          subjectId: null,
          mode: 'countdown',
          focusedSecs: 500,
          startedAt: todayMs - 3600 * 1000,
          endedAt: todayMs - 3600 * 1000,
        },
        todayMs - 3600 * 1000,
      );
      todayEarlier.day = '2026-05-10';
      await insertSession(todayEarlier, fakeDb);

      // streakBefore: yesterday was qualified (1), today is 500s (not qualified) -> current = 1
      const res = await saveSession(
        {
          id: 'crossing-session',
          subjectId: null,
          mode: 'countdown',
          focusedSecs: 150, // 500 + 150 = 650s >= 600s -> today qualifies!
          startedAt: todayMs - 150 * 1000,
          endedAt: todayMs,
        },
        { db: fakeDb, now: todayMs },
      );

      expect(res.saved).toBe(true);
      expect(res.streakBefore).toBe(1);
      expect(res.streakAfter).toBe(2);

      // Event emitted
      expect(emitSpy).toHaveBeenCalledWith('sessions/saved', {
        sessionId: 'crossing-session',
        day: '2026-05-10',
      });
    });

    test('stores subjectId as null if subject id does not exist', async () => {
      const res = await saveSession(
        {
          id: 'unknown-sub-session',
          subjectId: 'non-existent-subject-id-999',
          mode: 'countdown',
          focusedSecs: 300,
          startedAt: 1000,
          endedAt: 2000,
        },
        { db: fakeDb, now: 2000 },
      );

      expect(res.saved).toBe(true);
      expect(fakeDb.rows[0]?.subject_id).toBeNull();
    });

    test('discards sessions under 30s as noise without inserting or emitting', async () => {
      const res = await saveSession(
        {
          id: 'noise-session',
          subjectId: null,
          mode: 'countdown',
          focusedSecs: 25, // < 30s
          startedAt: 1000,
          endedAt: 1025000,
        },
        { db: fakeDb, now: 1025000 },
      );

      expect(res.saved).toBe(false);
      expect(fakeDb.rows.length).toBe(0);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
