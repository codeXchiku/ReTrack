import {
  createThemeModeStore,
  darkPalette,
  lightPalette,
  radii,
  spacing,
  subjectColors,
  typography,
} from '@/core/theme';
import { confirm, registerDialogListener } from '@/core/ui/dialog/dialogManager';
import type { DialogState } from '@/core/ui/dialog/types';
import { registerToastListener, showToast } from '@/core/ui/toast/toastManager';

describe('Theme Tokens & Helpers', () => {
  it('dark and light palettes have identical keys', () => {
    const darkKeys = Object.keys(darkPalette).sort();
    const lightKeys = Object.keys(lightPalette).sort();

    expect(darkKeys).toEqual(lightKeys);
    expect(darkKeys).toEqual([
      'accent',
      'background',
      'border',
      'danger',
      'focus',
      'onPrimary',
      'primary',
      'success',
      'surface',
      'surfaceAlt',
      'text',
      'textMuted',
    ]);
  });

  it('all palette values are valid hex color strings', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
    for (const val of Object.values(darkPalette)) {
      expect(val).toMatch(hexRegex);
    }
    for (const val of Object.values(lightPalette)) {
      expect(val).toMatch(hexRegex);
    }
  });

  it('defines the required spacing and radii scales', () => {
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 20, 24, 32]);
    expect(radii.sm).toBe(8);
    expect(radii.md).toBe(12);
    expect(radii.lg).toBe(20);
    expect(radii.pill).toBe(999);
  });

  it('defines the typography scale with tabular numbers on timer', () => {
    expect(typography.display.fontSize).toBe(40);
    expect(typography.title.fontSize).toBe(22);
    expect(typography.heading.fontSize).toBe(17);
    expect(typography.body.fontSize).toBe(15);
    expect(typography.caption.fontSize).toBe(12);
    expect(typography.timer.fontSize).toBe(64);
    expect(typography.timer.fontVariant).toEqual(['tabular-nums']);
  });

  it('defines exactly 8 subject colors', () => {
    expect(subjectColors).toHaveLength(8);
    const ids = subjectColors.map(s => s.id);
    expect(ids).toEqual([
      'blue',
      'red',
      'teal',
      'yellow',
      'pink',
      'purple',
      'orange',
      'green',
    ]);
  });

  it('manages theme mode via createThemeModeStore', () => {
    const store = createThemeModeStore('dark');
    expect(store.getState().mode).toBe('dark');

    store.getState().setMode('light');
    expect(store.getState().mode).toBe('light');

    store.getState().setMode('system');
    expect(store.getState().mode).toBe('system');
  });

  it('confirm dialog resolves true on confirm and false on cancel', async () => {
    let currentListener: DialogState | null = null;
    const unregister = registerDialogListener(state => {
      currentListener = state;
    });

    // Test Confirm
    const p1 = confirm({ title: 'Test', message: 'Msg' });
    const listener1 = currentListener as DialogState | null;
    expect(listener1).not.toBeNull();
    listener1?.resolve(true);
    const res1 = await p1;
    expect(res1).toBe(true);

    // Test Cancel
    const p2 = confirm({ title: 'Test 2', message: 'Msg 2' });
    const listener2 = currentListener as DialogState | null;
    expect(listener2).not.toBeNull();
    listener2?.resolve(false);
    const res2 = await p2;
    expect(res2).toBe(false);

    unregister();
  });

  it('showToast triggers active toast listener', () => {
    const received: { message: string; kind: string }[] = [];
    const unregister = registerToastListener(item => {
      if (item) {
        received.push(item);
      }
    });

    showToast('Saved!', 'success');
    expect(received).toHaveLength(1);
    expect(received[0]?.message).toBe('Saved!');
    expect(received[0]?.kind).toBe('success');

    unregister();
  });
});
