import { create } from 'zustand';

export type SilenceState = 'idle' | 'active' | 'blocked' | 'already_quiet';

export interface SilenceStoreState {
  granted: boolean;
  state: SilenceState;
  lastError?: string;
  setStatus: (
    next: Partial<Pick<SilenceStoreState, 'granted' | 'state' | 'lastError'>>,
  ) => void;
  reset: () => void;
}

export const useSilenceStore = create<SilenceStoreState>(set => ({
  granted: false,
  state: 'idle',
  lastError: undefined,
  setStatus: next =>
    set(prev => ({
      granted: next.granted ?? prev.granted,
      state: next.state ?? prev.state,
      lastError: 'lastError' in next ? next.lastError : prev.lastError,
    })),
  reset: () =>
    set({
      granted: false,
      state: 'idle',
      lastError: undefined,
    }),
}));
