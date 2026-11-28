import type { FeatureManifest } from '@/core/registry/types';
import { CardsIcon } from '@/core/ui';
import { LibraryScreen } from './screens/LibraryScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { setupCardsListeners, useCardsStore } from './store/cardsStore';

export const manifest: FeatureManifest = {
  id: 'cards',
  init: async () => {
    setupCardsListeners();
    await useCardsStore.getState().refresh();
  },
  tabs: [
    {
      id: 'cards',
      title: 'Cards',
      order: 30,
      icon: CardsIcon,
    },
  ],
  subTabs: [
    {
      tabId: 'cards',
      id: 'review',
      title: 'Review',
      order: 10,
      component: ReviewScreen,
    },
    {
      tabId: 'cards',
      id: 'library',
      title: 'Library',
      order: 20,
      component: LibraryScreen,
    },
  ],
};
