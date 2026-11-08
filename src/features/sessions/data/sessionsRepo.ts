import { type Db, getDb } from '@/core/db';
import type { SessionRow } from '../logic/types';

/**
 * Inserts a session row using INSERT OR IGNORE on id.
 * Saving the same session twice is harmless and idempotent.
 */
export async function insertSession(
  row: SessionRow,
  db?: Db,
): Promise<void> {
  const database = db ?? getDb();
  await database.exec(
    `INSERT OR IGNORE INTO sessions (
      id, subject_id, mode, planned_secs, focused_secs, started_at, ended_at, day, finished
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      row.id,
      row.subject_id,
      row.mode,
      row.planned_secs,
      row.focused_secs,
      row.started_at,
      row.ended_at,
      row.day,
      row.finished,
    ],
  );
}

/**
 * Returns focused seconds grouped by calendar day between fromDay and toDay (inclusive).
 * If fromDay and toDay are omitted, returns all days that contain session data.
 * Only returns days that contain session data.
 */
export async function getDailyTotals(
  fromDay?: string,
  toDay?: string,
  db?: Db,
): Promise<Record<string, number>> {
  const database = db ?? getDb();
  let sql = `SELECT day, SUM(focused_secs) as total_secs
     FROM sessions`;
  const params: unknown[] = [];

  if (fromDay !== undefined && toDay !== undefined) {
    sql += ' WHERE day >= ? AND day <= ?';
    params.push(fromDay, toDay);
  }

  sql += ' GROUP BY day;';

  const rows = await database.query<{ day: string; total_secs: number }>(
    sql,
    params,
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.day] = row.total_secs;
  }
  return result;
}

/**
 * Returns total focused seconds grouped by subject between fromDay and toDay (inclusive),
 * sorted by seconds descending.
 */
export async function getSubjectTotals(
  fromDay: string,
  toDay: string,
  db?: Db,
): Promise<{ subjectId: string | null; secs: number }[]> {
  const database = db ?? getDb();
  const rows = await database.query<{ subjectId: string | null; secs: number }>(
    `SELECT subject_id as subjectId, SUM(focused_secs) as secs
     FROM sessions
     WHERE day >= ? AND day <= ?
     GROUP BY subject_id
     ORDER BY secs DESC;`,
    [fromDay, toDay],
  );

  return rows.map(r => ({
    subjectId: r.subjectId,
    secs: Number(r.secs) || 0,
  }));
}

/**
 * Returns the lifetime total focused seconds across all sessions.
 */
export async function getTotalFocusedSecs(db?: Db): Promise<number> {
  const database = db ?? getDb();
  const row = await database.queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(focused_secs), 0) as total FROM sessions;',
  );
  return row ? Number(row.total) || 0 : 0;
}

/**
 * Returns the total number of recorded sessions.
 */
export async function getSessionCount(db?: Db): Promise<number> {
  const database = db ?? getDb();
  const row = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM sessions;',
  );
  return row ? Number(row.count) || 0 : 0;
}

/**
 * Deletes all sessions (used for test resets and dev playground).
 */
export async function clearSessions(db?: Db): Promise<void> {
  const database = db ?? getDb();
  await database.exec('DELETE FROM sessions;');
}
