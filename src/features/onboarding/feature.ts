import type { FeatureManifest } from '@/core/registry/types';
import { WelcomeStep } from './components/WelcomeStep';
import { onboardingDone } from './data/onboardingKeys';
import { OnboardingScreen } from './screens/OnboardingScreen';

export const manifest: FeatureManifest = {
  id: 'onboarding',
  screens: [
    {
      name: 'Onboarding',
      component: OnboardingScreen as React.ComponentType<Record<string, unknown>>,
      options: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
  ],
  startupRoute: {
    order: 10,
    resolve: () => (onboardingDone.get() ? null : 'Onboarding'),
  },
  slots: {
    'onboarding.steps': [
      {
        id: 'onboarding.welcome',
        order: 10,
        component: WelcomeStep as React.ComponentType<Record<string, unknown>>,
      },
    ],
  },
};
