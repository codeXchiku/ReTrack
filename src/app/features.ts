/**
 * THIS FILE IS THE ONLY PLACE FEATURES GET PLUGGED IN.
 * Do not edit other features or core to make room for a new one.
 * Register its manifest in the array below.
 */

import type { FeatureManifest } from '@/core/registry/types';
import { manifest as backupManifest } from '@/features/backup/feature';
import { manifest as cardsManifest } from '@/features/cards/feature';
import { manifest as focusManifest } from '@/features/focus/feature';
import { manifest as homeManifest } from '@/features/home/feature';
import { manifest as onboardingManifest } from '@/features/onboarding/feature';
import { manifest as sessionsManifest } from '@/features/sessions/feature';
import { manifest as settingsManifest } from '@/features/settings/feature';
import { manifest as silenceManifest } from '@/features/silence/feature';
import { manifest as statsManifest } from '@/features/stats/feature';
import { manifest as subjectsManifest } from '@/features/subjects/feature';

export const features: FeatureManifest[] = [
  homeManifest,
  focusManifest,
  silenceManifest,
  cardsManifest,
  subjectsManifest,
  sessionsManifest,
  statsManifest,
  settingsManifest,
  backupManifest,
  onboardingManifest,
];

