import { create } from 'zustand';
import type { TimerMode, TimerState } from '../logic/types';

export interface FocusResult {
  sessionId: string;
  subjectId: string | null;
  mode: TimerMode;
  focusedSecs: number;
  rounds: number;
  completed: boolean;
  saved: boolean;
  streakBefore: number;
  streakAfter: number;
  endedAt: number;
}

export interface FocusStoreState {
  active: TimerState | null;
  lastResult: FocusResult | null;
  hydrated: boolean;
  setActive: (active: TimerState | null) => void;
  setLastResult: (result: FocusResult | null) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
}

export const useFocusStore = create<FocusStoreState>(set => ({
  active: null,
  lastResult: null,
  hydrated: false,

  setActive: active => set({ active }),
  setLastResult: lastResult => set({ lastResult }),
  setHydrated: hydrated => set({ hydrated }),
  reset: () => set({ active: null, lastResult: null, hydrated: false }),
}));
