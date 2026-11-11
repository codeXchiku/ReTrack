import { createSetting } from '@/core/storage';

export const dailyGoalMinSetting = createSetting<number>(
  'settings.dailyGoalMin',
  120,
);

export const examNameSetting = createSetting<string>(
  'settings.examName',
  '',
);

export const examDateSetting = createSetting<string>(
  'settings.examDate',
  '',
);
