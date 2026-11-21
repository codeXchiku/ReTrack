import { NativeModules, Platform } from 'react-native';

export interface DndStatus {
  granted: boolean;
  currentFilter: number;
  ownedByApp: boolean;
  endsAt: number;
}

export type DndEnterResult = 'applied' | 'already_quiet' | 'not_granted' | 'error';
export type DndExitResult = 'restored' | 'nothing_to_restore' | 'error';

export interface DndNativeModule {
  isPolicyAccessGranted(): Promise<boolean>;
  openPolicyAccessSettings(): Promise<void>;
  getStatus(): Promise<DndStatus>;
  enter(endsAtMs: number): Promise<DndEnterResult>;
  exit(): Promise<DndExitResult>;
}

const fallbackStatus: DndStatus = {
  granted: false,
  currentFilter: 0,
  ownedByApp: false,
  endsAt: 0,
};

function getNativeModule(): DndNativeModule | undefined {
  return NativeModules.DndModule as DndNativeModule | undefined;
}

/**
 * Typed wrapper for Android Do Not Disturb native module with graceful fallback.
 */
export const dnd: DndNativeModule = {
  async isPolicyAccessGranted(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    const module = getNativeModule();
    if (!module?.isPolicyAccessGranted) {
      return false;
    }
    return module.isPolicyAccessGranted();
  },

  async openPolicyAccessSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    const module = getNativeModule();
    if (!module?.openPolicyAccessSettings) {
      return;
    }
    return module.openPolicyAccessSettings();
  },

  async getStatus(): Promise<DndStatus> {
    if (Platform.OS !== 'android') {
      return fallbackStatus;
    }
    const module = getNativeModule();
    if (!module?.getStatus) {
      return fallbackStatus;
    }
    return module.getStatus();
  },

  async enter(endsAtMs: number): Promise<DndEnterResult> {
    if (Platform.OS !== 'android') {
      return 'not_granted';
    }
    const module = getNativeModule();
    if (!module?.enter) {
      return 'not_granted';
    }
    return module.enter(endsAtMs);
  },

  async exit(): Promise<DndExitResult> {
    if (Platform.OS !== 'android') {
      return 'nothing_to_restore';
    }
    const module = getNativeModule();
    if (!module?.exit) {
      return 'nothing_to_restore';
    }
    return module.exit();
  },
};
