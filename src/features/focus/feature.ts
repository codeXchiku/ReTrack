import type { FeatureManifest } from '@/core/registry/types';
import { TimerIcon } from '@/core/ui';
import { PomodoroScreen } from './screens/PomodoroScreen';
import { SimpleTimerScreen } from './screens/SimpleTimerScreen';

export const manifest: FeatureManifest = {
  id: 'focus',
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
};
