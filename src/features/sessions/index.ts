/**
 * Public API for the sessions feature.
 * All other features import ONLY from this file.
 */

export type {
  SessionMode,
  SessionRow,
  StreaksResult,
} from './logic/types';

export {
  computeStreaks,
  STREAK_MIN_SECS,
} from './logic/streaks';

export {
  shouldSaveSession,
  MIN_SAVE_SECS,
} from './logic/sessionFilter';

export {
  buildSessionRow,
  type BuildSessionRowInput,
} from './logic/buildSessionRow';

export {
  getDailyTotals,
  getSubjectTotals,
  getTotalFocusedSecs,
  getSessionCount,
  clearSessions,
  insertSession,
} from './data/sessionsRepo';

export {
  saveSession,
  type SaveSessionResult,
  type SaveSessionOptions,
} from './data/saveSession';

export {
  useTodayFocusedSecs,
  useStreak,
  useDailyTotals,
  useSubjectTotals,
} from './data/hooks';

export { useSessionsStore } from './store/sessionsStore';
