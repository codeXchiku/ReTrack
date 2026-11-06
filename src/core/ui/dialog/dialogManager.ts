import type { ConfirmOptions, DialogState } from './types';

type DialogListener = (state: DialogState | null) => void;

let activeListener: DialogListener | null = null;

export function registerDialogListener(listener: DialogListener): () => void {
  activeListener = listener;
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
}

/**
 * Imperatively shows a confirmation dialog and resolves with user selection.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (!activeListener) {
      // If host not mounted, fallback to false
      resolve(false);
      return;
    }

    activeListener({
      ...options,
      resolve: value => {
        if (activeListener) {
          activeListener(null);
        }
        resolve(value);
      },
    });
  });
}

