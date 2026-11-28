import { useEffect } from 'react';
import type { CardStats, SubjectCardCounts } from '../logic/types';
import { useCardsStore } from '../store/cardsStore';

/**
 * Reactive hook returning per-subject card totals, due counts, and new counts.
 */
export function useCardCounts(): SubjectCardCounts[] {
  const counts = useCardsStore(s => s.countsBySubject);
  const status = useCardsStore(s => s.status);

  useEffect(() => {
    if (status === 'idle') {
      useCardsStore.getState().refresh().catch(() => {});
    }
  }, [status]);

  return counts;
}

/**
 * Reactive hook returning total introduced cards due through end of today.
 */
export function useDueCount(): number {
  const dueCount = useCardsStore(s => s.dueCount);
  const status = useCardsStore(s => s.status);

  useEffect(() => {
    if (status === 'idle') {
      useCardsStore.getState().refresh().catch(() => {});
    }
  }, [status]);

  return dueCount;
}

/**
 * Reactive hook returning total cards, mastered count (>= 21 days), and reviews today.
 */
export function useCardStats(): CardStats {
  const stats = useCardsStore(s => s.stats);
  const status = useCardsStore(s => s.status);

  useEffect(() => {
    if (status === 'idle') {
      useCardsStore.getState().refresh().catch(() => {});
    }
  }, [status]);

  return stats;
}
