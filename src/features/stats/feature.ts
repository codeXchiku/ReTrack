import type { FeatureManifest } from '@/core/registry/types';
import { StatsScreen } from './screens/StatsScreen';

export const manifest: FeatureManifest = {
  id: 'stats',
  subTabs: [
    {
      tabId: 'me',
      id: 'stats',
      title: 'Stats',
      order: 10,
      component: StatsScreen,
    },
  ],
};
