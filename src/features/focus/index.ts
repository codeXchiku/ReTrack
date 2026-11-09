/**
 * Public API for focus feature.
 * All other features import ONLY from this file.
 */

export * from './logic/types';
export * from './logic/presets';
export * from './logic/selectors';
export * from './logic/engine';

export {
  useFocusStore,
  type FocusResult,
  type FocusStoreState,
} from './store/focusStore';

export {
  focusController,
  lastConfigSetting,
  type StartFocusError,
  type StartFocusResult,
  type StartFocusOptions,
  type FocusStorage,
} from './services/focusController';

export * from './hooks';
