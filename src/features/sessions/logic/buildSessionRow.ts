import { toDay } from '@/core/time';
import { createId } from '@/core/utils';
import type { SessionMode, SessionRow } from './types';

export interface BuildSessionRowInput {
  id?: string;
  subjectId: string | null;
  mode: SessionMode;
  focusMs?: number;
  rounds?: number;
  plannedSecs?: number;
  focusedSecs?: number;
  focusedMs?: number;
  startedAt: number;
  endedAt?: number;
  completed?: boolean;
}

/**
 * Pure mapper converting timer session data into a validated SessionRow.
 */
export function buildSessionRow(
  input: BuildSessionRowInput,
  now: number,
): SessionRow {
  const endedAt = input.endedAt ?? now;
  const day = toDay(endedAt);

  let plannedSecs = input.plannedSecs ?? 0;
  if (input.plannedSecs === undefined) {
    if (input.mode === 'countdown') {
      plannedSecs = Math.floor((input.focusMs ?? 0) / 1000);
    } else if (input.mode === 'pomodoro') {
      const rounds = input.rounds ?? 1;
      const focusMs = input.focusMs ?? 0;
      plannedSecs = Math.floor((rounds * focusMs) / 1000);
    } else {
      plannedSecs = 0;
    }
  }

  let focusedSecs = input.focusedSecs ?? 0;
  if (input.focusedSecs === undefined && input.focusedMs !== undefined) {
    focusedSecs = Math.floor(input.focusedMs / 1000);
  }

  const finished = input.completed ? 1 : 0;

  return {
    id: input.id ?? createId(),
    subject_id: input.subjectId,
    mode: input.mode,
    planned_secs: plannedSecs,
    focused_secs: focusedSecs,
    started_at: input.startedAt,
    ended_at: endedAt,
    day,
    finished,
  };
}
