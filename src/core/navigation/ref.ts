import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<Record<string, unknown>>();

type PendingNavAction =
  | { type: 'tab'; tabId: string; subTabId?: string }
  | { type: 'screen'; name: string; params?: object };

const pendingQueue: PendingNavAction[] = [];

/**
 * Flushes any navigation actions queued while navigator was not ready.
 */
export function flushNavigationQueue(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  while (pendingQueue.length > 0) {
    const action = pendingQueue.shift();
    if (!action) {
      break;
    }
    if (action.type === 'tab') {
      navigateTo(action.tabId, action.subTabId);
    } else {
      navigateToScreen(action.name, action.params);
    }
  }
}

/**
 * Navigates to a specific bottom tab and optional sub-tab.
 * Safe to call before navigator is mounted (queues action).
 */
export function navigateTo(tabId: string, subTabId?: string): void {
  if (!navigationRef.isReady()) {
    pendingQueue.push({ type: 'tab', tabId, subTabId });
    return;
  }

  if (subTabId) {
    // Navigates into the top-tab sub navigator inside the target bottom tab
    navigationRef.navigate('Tabs', {
      screen: tabId,
      params: { screen: subTabId },
    } as unknown as Record<string, unknown>);
  } else {
    navigationRef.navigate('Tabs', {
      screen: tabId,
    } as unknown as Record<string, unknown>);
  }
}

/**
 * Navigates to a root stack screen (e.g. modals, detail pages, dev menu).
 * Safe to call before navigator is mounted (queues action).
 */
export function navigateToScreen(name: string, params?: object): void {
  if (!navigationRef.isReady()) {
    pendingQueue.push({ type: 'screen', name, params });
    return;
  }

  navigationRef.navigate(name, params as unknown as Record<string, unknown>);
}
