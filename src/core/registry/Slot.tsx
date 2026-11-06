import React from 'react';
import { getSlotItems } from './featureRegistry';
import { SlotErrorBoundary } from './SlotErrorBoundary';
import type { SlotItem, SlotName } from './types';

export type SlotProps = {
  name: SlotName;
  props?: Record<string, unknown>;
};

/**
 * Renders all items for a slot in sorted order, each within an isolated error boundary.
 */
export function Slot({ name, props }: SlotProps): React.JSX.Element {
  const items: SlotItem[] = getSlotItems(name);

  return (
    <>
      {items.map(item => {
        const ItemComponent = item.component;
        return (
          <SlotErrorBoundary key={item.id} slotName={name} itemId={item.id}>
            <ItemComponent {...(props ?? {})} />
          </SlotErrorBoundary>
        );
      })}
    </>
  );
}

