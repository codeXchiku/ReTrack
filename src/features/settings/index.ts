import { today } from '@/core/time';
import {
  dailyGoalMinSetting,
  examDateSetting,
  examNameSetting,
} from './data/settingsKeys';
import { clampGoal, getDaysLeft } from './logic/exam';

export { clampGoal, getDaysLeft } from './logic/exam';

/**
 * Hook returning the user's daily study goal in minutes.
 */
export function useDailyGoalMin(): number {
  return dailyGoalMinSetting.useValue();
}

/**
 * Synchronous getter returning the daily study goal in minutes.
 */
export function getDailyGoalMin(): number {
  return dailyGoalMinSetting.get();
}

/**
 * Sets the daily study goal in minutes, clamped to [15..720] in steps of 15 min.
 */
export function setDailyGoalMin(min: number): void {
  dailyGoalMinSetting.set(clampGoal(min));
}

export type ExamInfo = {
  name: string;
  date: string;
  daysLeft: number | null;
};

/**
 * Hook returning current exam details and calculated days remaining.
 */
export function useExam(): ExamInfo {
  const name = examNameSetting.useValue();
  const date = examDateSetting.useValue();
  const todayStr = today();
  const daysLeft = getDaysLeft(date, todayStr);

  return {
    name,
    date,
    daysLeft,
  };
}

/**
 * Synchronous getter returning current exam details and calculated days remaining.
 */
export function getExam(): ExamInfo {
  const name = examNameSetting.get();
  const date = examDateSetting.get();
  const todayStr = today();
  const daysLeft = getDaysLeft(date, todayStr);

  return {
    name,
    date,
    daysLeft,
  };
}

/**
 * Sets exam name and date (YYYY-MM-DD).
 */
export function setExam(params: { name: string; date: string }): void {
  examNameSetting.set(params.name.trim());
  examDateSetting.set(params.date.trim());
}

/**
 * Clears the active exam.
 */
export function clearExam(): void {
  examNameSetting.set('');
  examDateSetting.set('');
}
