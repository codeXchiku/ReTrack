import {
  dnd,
  type DndEnterResult,
  type DndExitResult,
  type DndNativeModule,
  type DndStatus,
} from './native/DndModule';

/**
 * Public API for the silence feature.
 * Thin pass-through to the Android native DndModule.
 */
export const silenceApi: DndNativeModule = {
  isPolicyAccessGranted: () => dnd.isPolicyAccessGranted(),
  openPolicyAccessSettings: () => dnd.openPolicyAccessSettings(),
  getStatus: () => dnd.getStatus(),
  enter: (endsAtMs: number) => dnd.enter(endsAtMs),
  exit: () => dnd.exit(),
};

export { dnd };
export type { DndEnterResult, DndExitResult, DndNativeModule, DndStatus };
