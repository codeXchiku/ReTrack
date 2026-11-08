import { createSetting } from '@/core/storage';

export const onboardingDone = createSetting<boolean>('onboarding.done', false);
