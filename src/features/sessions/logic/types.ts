export type SessionMode = 'countdown' | 'stopwatch' | 'pomodoro';

export interface SessionRow {
  id: string;
  subject_id: string | null;
  mode: SessionMode;
  planned_secs: number;
  focused_secs: number;
  started_at: number;
  ended_at: number;
  day: string; // 'YYYY-MM-DD'
  finished: number; // 0 | 1
}

export interface StreaksResult {
  current: number;
  best: number;
  todayQualified: boolean;
}
