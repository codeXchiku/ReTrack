/* global jest */
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => ({
    execute: jest.fn(async () => ({ rows: [] })),
    close: jest.fn(),
  })),
}));
jest.mock('@sayem314/react-native-keep-awake', () => ({
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
  useKeepAwake: jest.fn(),
  default: () => null,
}));
jest.mock('@notifee/react-native', () =>
  require('@notifee/react-native/jest-mock'),
);
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
  },
  default: {
    trigger: jest.fn(),
  },
}));

const { NativeModules } = require('react-native');
NativeModules.DndModule = {
  isPolicyAccessGranted: jest.fn(async () => true),
  openPolicyAccessSettings: jest.fn(async () => {}),
  getStatus: jest.fn(async () => ({
    granted: true,
    currentFilter: 1,
    ownedByApp: false,
    endsAt: 0,
  })),
  enter: jest.fn(async () => 'applied'),
  exit: jest.fn(async () => 'restored'),
};


