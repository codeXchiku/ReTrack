import type { FeatureManifest } from '@/core/registry/types';
import { HomeIcon } from '@/core/ui';
import { HomeScreen } from './screens/HomeScreen';

export const manifest: FeatureManifest = {
  id: 'home',
  tabs: [
    {
      id: 'home',
      title: 'Home',
      order: 10,
      icon: HomeIcon,
      component: HomeScreen,
    },
  ],
};
