/**
 * Type definitions for the cards feature.
 */

export type Rating = 'forgot' | 'hard' | 'easy';

export interface Card {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: number;
  introducedAt: number | null;
  lastReviewedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CardRow {
  id: string;
  subject_id: string;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due_at: number;
  introduced_at: number | null;
  last_reviewed_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface SubjectCardCounts {
  subjectId: string;
  total: number;
  due: number;
  new: number;
}

export interface CardStats {
  total: number;
  mastered: number;
  reviewedToday: number;
}

export interface RecordReviewInput {
  cardId: string;
  rating: Rating;
  reviewedAt: number;
  next: {
    ease: number;
    intervalDays: number;
    reps: number;
    lapses: number;
    dueAt: number;
  };
  intervalBefore: number;
}
