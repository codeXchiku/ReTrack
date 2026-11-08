import { type Db } from '@/core/db';
import { eventBus } from '@/core/events';
import { getSubjectSync } from '@/features/subjects';
import {
  buildSessionRow,
  type BuildSessionRowInput,
} from '../logic/buildSessionRow';
import { shouldSaveSession } from '../logic/sessionFilter';
import { computeStreaks } from '../logic/streaks';
import { getDailyTotals, insertSession } from './sessionsRepo';

export interface SaveSessionResult {
  saved: boolean;
  streakBefore: number;
  streakAfter: number;
}

export interface SaveSessionOptions {
  db?: Db;
  now?: number;
}

/**
 * Saves a study session to SQLite:
 * 1. Verifies subject exists via subjects public API; if deleted, sets subject_id = null.
 * 2. Checks shouldSaveSession (>= 30s focused); if under 30s, discards as noise.
 * 3. Calculates streakBefore and streakAfter.
 * 4. Inserts into database and emits 'sessions/saved' event.
 */
export async function saveSession(
  input: BuildSessionRowInput,
  options: SaveSessionOptions = {},
): Promise<SaveSessionResult> {
  const now = options.now ?? Date.now();

  // Validate subject existence through public API
  let validSubjectId: string | null = null;
  if (input.subjectId) {
    try {
      const subject = getSubjectSync(input.subjectId);
      if (subject) {
        validSubjectId = subject.id;
      }
    } catch {
      validSubjectId = null;
    }
  }

  const row = buildSessionRow(
    {
      ...input,
      subjectId: validSubjectId,
    },
    now,
  );

  // Compute daily totals before insert
  const totalsBefore = await getDailyTotals(undefined, undefined, options.db);
  const streakBefore = computeStreaks(totalsBefore, row.day).current;

  // Check noise threshold (30s)
  if (!shouldSaveSession(row.focused_secs)) {
    return {
      saved: false,
      streakBefore,
      streakAfter: streakBefore,
    };
  }

  // Insert session
  await insertSession(row, options.db);

  // Compute updated daily totals & streakAfter
  const totalsAfter: Record<string, number> = {
    ...totalsBefore,
    [row.day]: (totalsBefore[row.day] ?? 0) + row.focused_secs,
  };
  const streakAfter = computeStreaks(totalsAfter, row.day).current;

  // Emit typed event on event bus
  eventBus.emit('sessions/saved', {
    sessionId: row.id,
    day: row.day,
  });

  return {
    saved: true,
    streakBefore,
    streakAfter,
  };
}
