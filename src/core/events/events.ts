export type AppEvents = {
  'focus/phaseStarted': {
    sessionId: string;
    phase: 'focus' | 'break' | 'longBreak';
    endsAt: number | null;
    silence: boolean;
  };
  'focus/paused': { sessionId: string };
  'focus/resumed': {
    sessionId: string;
    phase: 'focus' | 'break' | 'longBreak';
    endsAt: number | null;
    silence: boolean;
  };
  'focus/stopped': { sessionId: string };
  'focus/finished': {
    sessionId: string;
    focusedSecs: number;
    completed: boolean;
  };
  'sessions/saved': { sessionId: string; day: string };
  'cards/changed': { subjectId: string | null };
  'cards/reviewed': { cardId: string; rating: 'forgot' | 'hard' | 'easy' };
  'subjects/changed': Record<string, never>;
  'subjects/deleted': { subjectId: string };
};

