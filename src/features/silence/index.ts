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

export {
  planFor,
  STOPWATCH_CAP_MS,
  type SilenceFocusEvent,
  type SilenceFocusPhase,
  type SilencePlan,
  type SilencePlanContext,
} from './logic/silencePlan';

export {
  useSilenceStore,
  type SilenceState,
  type SilenceStoreState,
} from './store/silenceStore';

export { silenceService } from './services/silenceService';
export { SilenceBadge } from './components/SilenceBadge';
export {
  SilenceHint,
  dismissSilenceHint,
  resetSilenceHintForTest,
} from './components/SilenceHint';
export { SilencePermissionStep } from './components/SilencePermissionStep';
export { SilenceSection } from './components/SilenceSection';
