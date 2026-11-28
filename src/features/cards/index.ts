/**
 * Public API for the cards feature.
 * All other features import ONLY from this file.
 */

import type { Db } from '@/core/db';
import { endOfDay, startOfDay } from '@/core/time';
import { countDue, getCardStats } from './data/cardsRepo';
import type { CardStats } from './logic/types';

export type {
  Card,
  CardRow,
  CardStats,
  Rating,
  RecordReviewInput,
  SubjectCardCounts,
} from './logic/types';

export {
  CARD_TEXT_MAX_LEN,
  isDuplicate,
  validateCard,
  type CardValidationError,
  type CardValidationResult,
} from './logic/validateCard';

export {
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
  MASTERED_INTERVAL_DAYS,
  recordReview,
  updateCard,
  type CardRepoError,
  type CardResult,
  type CreateCardInput,
  type ListCardsOptions,
  type UpdateCardInput,
} from './data/cardsRepo';

export { useCardCounts, useCardStats, useDueCount } from './data/hooks';
export { setupCardsListeners, useCardsStore } from './store/cardsStore';

/**
 * Minimal cross-feature read API for home/stats/focus features.
 */
export const cardsApi = {
  countDue: (
    endOfTodayMs: number = endOfDay(Date.now()),
    db?: Db,
  ): Promise<number> => countDue(endOfTodayMs, db),
  getCardStats: (
    startOfDayMs: number = startOfDay(Date.now()),
    db?: Db,
  ): Promise<CardStats> => getCardStats(startOfDayMs, db),
};
