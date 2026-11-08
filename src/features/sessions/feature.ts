import type { FeatureManifest } from '@/core/registry/types';
import {
  setupSessionsListeners,
  useSessionsStore,
} from './store/sessionsStore';

export const manifest: FeatureManifest = {
  id: 'sessions',
  init: async () => {
    setupSessionsListeners();
    await useSessionsStore.getState().refresh();
  },
};
