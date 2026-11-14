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
export * from './logic/timerFormat';
export * from './logic/labels';
export {
  ActiveSessionView,
  type ActiveSessionViewProps,
} from './components/ActiveSessionView';
export {
  FinishedView,
  type FinishedViewProps,
} from './components/FinishedView';
export {
  RoundDots,
  type RoundDotsProps,
} from './components/RoundDots';
export {
  SessionOptions,
  type SessionOptionsProps,
} from './components/SessionOptions';
export {
  NotificationPermissionStep,
} from './components/NotificationPermissionStep';
export * from './logic/notificationText';
export { feedbackService } from './services/feedbackService';
export {
  notificationService,
  ensureNotificationPermission,
  resetPermissionToastFlag,
  RUNNING_CHANNEL_ID,
  SESSION_END_CHANNEL_ID,
  SESSION_END_SILENT_CHANNEL_ID,
  RUNNING_NOTIFICATION_ID,
  ALERT_NOTIFICATION_ID,
} from './services/notificationService';
