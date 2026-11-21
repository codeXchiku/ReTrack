import { NativeModules, Platform } from 'react-native';
import { dnd, silenceApi } from '@/features/silence';

describe('DndModule TypeScript wrapper', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
    jest.clearAllMocks();
  });

  describe('Non-Android platform fallback', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('returns false for isPolicyAccessGranted on non-Android', async () => {
      const granted = await dnd.isPolicyAccessGranted();
      expect(granted).toBe(false);
    });

    it('resolves cleanly for openPolicyAccessSettings on non-Android', async () => {
      await expect(dnd.openPolicyAccessSettings()).resolves.toBeUndefined();
    });

    it('returns fallback status on non-Android', async () => {
      const status = await dnd.getStatus();
      expect(status).toEqual({
        granted: false,
        currentFilter: 0,
        ownedByApp: false,
        endsAt: 0,
      });
    });

    it('returns not_granted for enter on non-Android', async () => {
      const res = await dnd.enter(Date.now() + 60000);
      expect(res).toBe('not_granted');
    });

    it('returns nothing_to_restore for exit on non-Android', async () => {
      const res = await dnd.exit();
      expect(res).toBe('nothing_to_restore');
    });
  });

  describe('Missing native module fallback on Android', () => {
    let originalDndModule: unknown;

    beforeEach(() => {
      Platform.OS = 'android';
      originalDndModule = NativeModules.DndModule;
      NativeModules.DndModule = undefined;
    });

    afterEach(() => {
      NativeModules.DndModule = originalDndModule;
    });

    it('returns false for isPolicyAccessGranted when module is missing', async () => {
      const granted = await dnd.isPolicyAccessGranted();
      expect(granted).toBe(false);
    });

    it('resolves cleanly for openPolicyAccessSettings when module is missing', async () => {
      await expect(dnd.openPolicyAccessSettings()).resolves.toBeUndefined();
    });

    it('returns fallback status when module is missing', async () => {
      const status = await dnd.getStatus();
      expect(status).toEqual({
        granted: false,
        currentFilter: 0,
        ownedByApp: false,
        endsAt: 0,
      });
    });

    it('returns not_granted for enter when module is missing', async () => {
      const res = await dnd.enter(123456);
      expect(res).toBe('not_granted');
    });

    it('returns nothing_to_restore for exit when module is missing', async () => {
      const res = await dnd.exit();
      expect(res).toBe('nothing_to_restore');
    });
  });

  describe('Android with native module present', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      NativeModules.DndModule = {
        isPolicyAccessGranted: jest.fn(async () => true),
        openPolicyAccessSettings: jest.fn(async () => {}),
        getStatus: jest.fn(async () => ({
          granted: true,
          currentFilter: 2,
          ownedByApp: true,
          endsAt: 1700000000000,
        })),
        enter: jest.fn(async (_endsAtMs: number) => 'applied'),
        exit: jest.fn(async () => 'restored'),
      };
    });

    it('forwards isPolicyAccessGranted', async () => {
      const res = await dnd.isPolicyAccessGranted();
      expect(res).toBe(true);
      expect(NativeModules.DndModule.isPolicyAccessGranted).toHaveBeenCalledTimes(1);
    });

    it('forwards openPolicyAccessSettings', async () => {
      await dnd.openPolicyAccessSettings();
      expect(NativeModules.DndModule.openPolicyAccessSettings).toHaveBeenCalledTimes(1);
    });

    it('forwards getStatus', async () => {
      const status = await dnd.getStatus();
      expect(status).toEqual({
        granted: true,
        currentFilter: 2,
        ownedByApp: true,
        endsAt: 1700000000000,
      });
      expect(NativeModules.DndModule.getStatus).toHaveBeenCalledTimes(1);
    });

    it('forwards enter with endsAtMs argument', async () => {
      const endsAt = Date.now() + 45000;
      const res = await dnd.enter(endsAt);
      expect(res).toBe('applied');
      expect(NativeModules.DndModule.enter).toHaveBeenCalledWith(endsAt);
    });

    it('forwards exit', async () => {
      const res = await dnd.exit();
      expect(res).toBe('restored');
      expect(NativeModules.DndModule.exit).toHaveBeenCalledTimes(1);
    });
  });

  describe('silenceApi public export', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      NativeModules.DndModule = {
        isPolicyAccessGranted: jest.fn(async () => true),
        openPolicyAccessSettings: jest.fn(async () => {}),
        getStatus: jest.fn(async () => ({
          granted: true,
          currentFilter: 1,
          ownedByApp: false,
          endsAt: 0,
        })),
        enter: jest.fn(async () => 'already_quiet'),
        exit: jest.fn(async () => 'nothing_to_restore'),
      };
    });

    it('forwards all silenceApi calls to dnd', async () => {
      expect(await silenceApi.isPolicyAccessGranted()).toBe(true);
      await silenceApi.openPolicyAccessSettings();
      expect(NativeModules.DndModule.openPolicyAccessSettings).toHaveBeenCalledTimes(1);
      const status = await silenceApi.getStatus();
      expect(status.granted).toBe(true);
      expect(await silenceApi.enter(999)).toBe('already_quiet');
      expect(await silenceApi.exit()).toBe('nothing_to_restore');
    });
  });
});
