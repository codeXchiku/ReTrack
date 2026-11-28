import type React from 'react';
import type { FeatureManifest } from '@/core/registry/types';
import { SilenceBadge } from './components/SilenceBadge';
import { SilenceHint } from './components/SilenceHint';
import { SilencePermissionStep } from './components/SilencePermissionStep';
import { SilenceSection } from './components/SilenceSection';
import { silenceService } from './services/silenceService';

export const manifest: FeatureManifest = {
  id: 'silence',
  init: async () => {
    await silenceService.init();
  },
  slots: {
    'focus.setupHints': [
      {
        id: 'silence.hint',
        order: 10,
        component: SilenceHint,
      },
    ],
    'focus.activeBadges': [
      {
        id: 'silence.badge',
        order: 10,
        component: SilenceBadge,
      },
    ],
    'settings.sections': [
      {
        id: 'silence.section',
        order: 10,
        component: SilenceSection,
      },
    ],
    'onboarding.steps': [
      {
        id: 'silence.permission',
        order: 40,
        component: SilencePermissionStep as React.ComponentType<Record<string, unknown>>,
      },
    ],
  },
};
