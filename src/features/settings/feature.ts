import type { FeatureManifest } from '@/core/registry/types';
import { UserIcon } from '@/core/ui';
import { GoalExamStep } from './components/GoalExamStep';
import { SettingsScreen } from './screens/SettingsScreen';

export const manifest: FeatureManifest = {
  id: 'settings',
  tabs: [
    {
      id: 'me',
      title: 'Me',
      order: 40,
      icon: UserIcon,
    },
  ],
  subTabs: [
    {
      tabId: 'me',
      id: 'settings',
      title: 'Settings',
      order: 20,
      component: SettingsScreen,
    },
  ],
  slots: {
    'onboarding.steps': [
      {
        id: 'settings.onboarding',
        order: 30,
        component: GoalExamStep as React.ComponentType<Record<string, unknown>>,
      },
    ],
  },
};

