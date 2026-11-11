import {
  clearRegistry,
  getSlotItems,
  registerFeatures,
} from '@/core/registry';
import { manifest as onboardingManifest } from '@/features/onboarding/feature';
import { manifest as settingsManifest } from '@/features/settings/feature';
import { manifest as subjectsManifest } from '@/features/subjects/feature';
import { onboardingDone } from '@/features/onboarding';
import {
  clearExam,
  getDailyGoalMin,
  getExam,
  setDailyGoalMin,
  setExam,
} from '@/features/settings';

describe('features/onboarding & settings integration', () => {
  beforeEach(() => {
    clearRegistry();
    onboardingDone.reset();
  });

  afterEach(() => {
    clearRegistry();
  });

  it('orders onboarding steps correctly (Welcome=10, Subjects=20, Settings=30)', () => {
    registerFeatures([
      settingsManifest,
      onboardingManifest,
      subjectsManifest,
    ]);

    const stepItems = getSlotItems('onboarding.steps');
    expect(stepItems).toHaveLength(3);
    expect(stepItems[0]?.id).toBe('onboarding.welcome');
    expect(stepItems[0]?.order).toBe(10);
    expect(stepItems[1]?.id).toBe('subjects.onboarding');
    expect(stepItems[1]?.order).toBe(20);
    expect(stepItems[2]?.id).toBe('settings.onboarding');
    expect(stepItems[2]?.order).toBe(30);
  });

  it('resolves startupRoute to Onboarding when onboarding is not done', () => {
    onboardingDone.set(false);
    const resolved = onboardingManifest.startupRoute?.resolve();
    expect(resolved).toBe('Onboarding');
  });

  it('resolves startupRoute to null when onboarding is done', () => {
    onboardingDone.set(true);
    const resolved = onboardingManifest.startupRoute?.resolve();
    expect(resolved).toBeNull();
  });

  it('sets and clears exam details correctly', () => {
    setExam({ name: 'UPSC 2027', date: '2027-05-25' });
    const exam = getExam();
    expect(exam.name).toBe('UPSC 2027');
    expect(exam.date).toBe('2027-05-25');
    expect(typeof exam.daysLeft).toBe('number');

    clearExam();
    const cleared = getExam();
    expect(cleared.name).toBe('');
    expect(cleared.date).toBe('');
    expect(cleared.daysLeft).toBeNull();
  });

  it('sets daily study goal clamped to valid range', () => {
    setDailyGoalMin(135);
    expect(getDailyGoalMin()).toBe(135);

    setDailyGoalMin(5);
    expect(getDailyGoalMin()).toBe(15);

    setDailyGoalMin(1000);
    expect(getDailyGoalMin()).toBe(720);
  });
});
