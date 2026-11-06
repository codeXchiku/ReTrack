import { createId } from '@/core/utils/createId';
import type { ToastKind, ToastMessage } from './types';

type ToastListener = (toast: ToastMessage | null) => void;

let activeListener: ToastListener | null = null;
let currentTimer: ReturnType<typeof setTimeout> | null = null;

export function registerToastListener(listener: ToastListener): () => void {
  activeListener = listener;
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
}

/**
 * Imperatively displays a toast message for 2 seconds.
 */
export function showToast(
  message: string,
  kind: ToastKind = 'info',
): void {
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }

  const toastItem: ToastMessage = {
    id: createId(),
    message,
    kind,
  };

  if (activeListener) {
    activeListener(toastItem);
    currentTimer = setTimeout(() => {
      if (activeListener) {
        activeListener(null);
      }
      currentTimer = null;
    }, 2000);
  }
}
