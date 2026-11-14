import type { FeatureManifest } from '@/core/registry/types';
import { TimerIcon } from '@/core/ui';
import { NotificationPermissionStep } from './components/NotificationPermissionStep';
import { PomodoroScreen } from './screens/PomodoroScreen';
import { SimpleTimerScreen } from './screens/SimpleTimerScreen';
import { focusController } from './services/focusController';
import { notificationService } from './services/notificationService';

export const manifest: FeatureManifest = {
  id: 'focus',
  init: async () => {
    await notificationService.init();
    await focusController.restore();
  },
  tabs: [
    {
      id: 'focus',
      title: 'Focus',
      order: 20,
      icon: TimerIcon,
    },
  ],
  subTabs: [
    {
      tabId: 'focus',
      id: 'simple',
      title: 'Simple',
      order: 10,
      component: SimpleTimerScreen,
    },
    {
      tabId: 'focus',
      id: 'pomodoro',
      title: 'Pomodoro',
      order: 20,
      component: PomodoroScreen,
    },
  ],
  slots: {
    'onboarding.steps': [
      {
        id: 'focus.notifications',
        order: 50,
        component: NotificationPermissionStep as React.ComponentType<Record<string, unknown>>,
      },
    ],
  },
};
