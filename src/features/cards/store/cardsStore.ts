import { AppState } from 'react-native';
import { create } from 'zustand';
import { eventBus } from '@/core/events';
import { endOfDay, startOfDay, today } from '@/core/time';
import { countDue, countsBySubject, getCardStats } from '../data/cardsRepo';
import type { CardStats, SubjectCardCounts } from '../logic/types';

export interface CardsStoreState {
  countsBySubject: SubjectCardCounts[];
  dueCount: number;
  stats: CardStats;
  revision: number;
  status: 'idle' | 'loading' | 'ready';
  refresh: (now?: number) => Promise<void>;
}

export const useCardsStore = create<CardsStoreState>((set, get) => ({
  countsBySubject: [],
  dueCount: 0,
  stats: { total: 0, mastered: 0, reviewedToday: 0 },
  revision: 0,
  status: 'idle',

  refresh: async (customNow?: number) => {
    set({ status: 'loading' });
    try {
      const now = customNow ?? Date.now();
      const startMs = startOfDay(now);
      const endMs = endOfDay(now);

      const [counts, due, stats] = await Promise.all([
        countsBySubject(endMs),
        countDue(endMs),
        getCardStats(startMs),
      ]);

      set({
        countsBySubject: counts,
        dueCount: due,
        stats,
        revision: get().revision + 1,
        status: 'ready',
      });
    } catch {
      set({ status: 'ready' });
    }
  },
}));

let dayCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastKnownDay = today();
let listenersInitialized = false;

/**
 * Initializes listeners for cards/subject events, app foreground resume,
 * and calendar day rollover so card hooks refresh automatically.
 */
export function setupCardsListeners(): () => void {
  if (listenersInitialized) {
    return () => {};
  }
  listenersInitialized = true;

  const triggerRefresh = () => {
    useCardsStore.getState().refresh().catch(() => {});
  };

  const unsubChanged = eventBus.on('cards/changed', triggerRefresh);
  const unsubReviewed = eventBus.on('cards/reviewed', triggerRefresh);
  const unsubSubjectsChanged = eventBus.on('subjects/changed', triggerRefresh);
  const unsubSubjectsDeleted = eventBus.on('subjects/deleted', triggerRefresh);

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      lastKnownDay = today();
      triggerRefresh();
    }
  });

  if (!dayCheckInterval) {
    dayCheckInterval = setInterval(() => {
      const currentDay = today();
      if (currentDay !== lastKnownDay) {
        lastKnownDay = currentDay;
        triggerRefresh();
      }
    }, 30000);
    const timerHandle: unknown = dayCheckInterval;
    if (
      typeof timerHandle === 'object' &&
      timerHandle !== null &&
      'unref' in timerHandle &&
      typeof (timerHandle as { unref?: unknown }).unref === 'function'
    ) {
      (timerHandle as { unref: () => void }).unref();
    }
  }

  return () => {
    listenersInitialized = false;
    unsubChanged();
    unsubReviewed();
    unsubSubjectsChanged();
    unsubSubjectsDeleted();
    appStateSub.remove();
    if (dayCheckInterval) {
      clearInterval(dayCheckInterval);
      dayCheckInterval = null;
    }
  };
}
