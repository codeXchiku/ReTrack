import type { FeatureManifest } from '@/core/registry/types';
import { ManageSubjectsSlotRow } from './components/ManageSubjectsSlotRow';
import { SubjectsStep } from './components/SubjectsStep';
import { ManageSubjectsScreen } from './screens/ManageSubjectsScreen';
import { useSubjectsStore } from './store/subjectsStore';

export const manifest: FeatureManifest = {
  id: 'subjects',
  screens: [
    {
      name: 'ManageSubjects',
      component: ManageSubjectsScreen,
      options: { title: 'Subjects' },
    },
  ],
  slots: {
    'settings.sections': [
      {
        id: 'subjects.manage',
        order: 20,
        component: ManageSubjectsSlotRow,
      },
    ],
    'onboarding.steps': [
      {
        id: 'subjects.onboarding',
        order: 20,
        component: SubjectsStep as React.ComponentType<Record<string, unknown>>,
      },
    ],
  },
  init: async () => {
    await useSubjectsStore.getState().load();
  },
};

