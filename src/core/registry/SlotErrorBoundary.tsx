import { Component, type ErrorInfo, type ReactNode } from 'react';
import { log } from '@/core/utils/log';
import type { SlotName } from './types';

export type SlotErrorBoundaryProps = {
  slotName: SlotName;
  itemId: string;
  children: ReactNode;
};

export type SlotErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Isolates runtime rendering errors in individual slot items.
 */
export class SlotErrorBoundary extends Component<
  SlotErrorBoundaryProps,
  SlotErrorBoundaryState
> {
  override state: SlotErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SlotErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log.error(
      `[SlotErrorBoundary] Error rendering item "${this.props.itemId}" in slot "${this.props.slotName}":`,
      error,
      errorInfo,
    );
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

