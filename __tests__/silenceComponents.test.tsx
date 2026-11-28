import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { silenceDefaultSetting } from '@/core/prefs';
import { useFocusStore, type TimerState } from '@/features/focus';
import {
  dnd,
  resetSilenceHintForTest,
  SilenceBadge,
  SilenceHint,
  SilencePermissionStep,
  SilenceSection,
  useSilenceStore,
} from '@/features/silence';

function makeActiveFocusState(silence: boolean): TimerState {
  return {
    sessionId: 'sess-ui-1',
    config: {
      mode: 'countdown',
      subjectId: null,
      focusMs: 600_000,
      breakMs: 0,
      longBreakMs: 0,
      rounds: 1,
      silence,
      keepAwake: true,
    },
    status: 'running',
    phase: 'focus',
    round: 1,
    phaseDurationMs: 600_000,
    segmentStartedAt: 1_000_000,
    elapsedBeforeMs: 0,
    focusedMsDone: 0,
    startedAt: 1_000_000,
    endedAt: null,
    completed: false,
  };
}

describe('Silence slot components', () => {
  const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

  async function render(el: React.ReactElement) {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(el);
    });
    mounted.push(renderer);
    return renderer;
  }

  beforeEach(() => {
    useSilenceStore.getState().reset();
    useFocusStore.getState().reset();
    silenceDefaultSetting.set(true);
    resetSilenceHintForTest();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    while (mounted.length > 0) {
      const r = mounted.pop();
      await ReactTestRenderer.act(() => {
        r?.unmount();
      });
    }
  });

  describe('SilenceSection (settings.sections)', () => {
    it('renders toggle bound to silenceDefault and NOT GRANTED with Fix button when not granted', async () => {
      useSilenceStore.setState({ granted: false });
      const openSpy = jest
        .spyOn(dnd, 'openPolicyAccessSettings')
        .mockResolvedValue();

      const renderer = await render(<SilenceSection />);

      const json = JSON.stringify(renderer.toJSON());
      expect(json).toContain('Silence');
      expect(json).toContain('Silence notifications while focusing');
      expect(json).toContain('NOT GRANTED');
      expect(json).toContain('Fix');
      expect(json).toContain(
        'Android only. Calls and alarms from your priority list still come through.',
      );

      const fixButton = renderer.root.findByProps({
        accessibilityLabel: 'Fix Do Not Disturb access',
      });
      await ReactTestRenderer.act(() => {
        fixButton.props.onPress();
      });
      expect(openSpy).toHaveBeenCalledTimes(1);

      const switchEl = renderer.root.findByProps({
        accessibilityRole: 'switch',
      });
      await ReactTestRenderer.act(() => {
        switchEl.props.onPress();
      });
      expect(silenceDefaultSetting.get()).toBe(false);

      openSpy.mockRestore();
    });

    it('renders GRANTED without Fix button when policy access is granted', async () => {
      useSilenceStore.setState({ granted: true });

      const renderer = await render(<SilenceSection />);

      const json = JSON.stringify(renderer.toJSON());
      expect(json).toContain('GRANTED');
      expect(json).not.toContain('NOT GRANTED');
      expect(json).not.toContain('"Fix"');
    });
  });

  describe('SilenceHint (focus.setupHints)', () => {
    it('shows when silenceDefault=true and granted=false, and hides when dismissed', async () => {
      useSilenceStore.setState({ granted: false });
      silenceDefaultSetting.set(true);

      const renderer = await render(<SilenceHint />);

      expect(JSON.stringify(renderer.toJSON())).toContain(
        'Allow Do Not Disturb access so Study Dojo can silence your phone while you focus.',
      );

      const dismissBtn = renderer.root.findByProps({
        accessibilityLabel: 'Dismiss Do Not Disturb hint',
      });
      await ReactTestRenderer.act(() => {
        dismissBtn.props.onPress();
      });

      expect(renderer.toJSON()).toBeNull();
    });

    it('renders null when granted=true or silenceDefault=false', async () => {
      useSilenceStore.setState({ granted: true });
      const renderer1 = await render(<SilenceHint />);
      expect(renderer1.toJSON()).toBeNull();

      await ReactTestRenderer.act(() => {
        useSilenceStore.setState({ granted: false });
        silenceDefaultSetting.set(false);
      });
      const renderer2 = await render(<SilenceHint />);
      expect(renderer2.toJSON()).toBeNull();
    });
  });

  describe('SilenceBadge (focus.activeBadges)', () => {
    it('renders nothing when session has silence = false', async () => {
      useFocusStore.setState({ active: makeActiveFocusState(false) });
      useSilenceStore.setState({ state: 'active', granted: true });

      const renderer = await render(<SilenceBadge />);
      expect(renderer.toJSON()).toBeNull();
    });

    it('renders active, blocked (tappable), and already_quiet chips appropriately', async () => {
      useFocusStore.setState({ active: makeActiveFocusState(true) });
      useSilenceStore.setState({ state: 'active', granted: true });

      const renderer = await render(<SilenceBadge />);
      expect(JSON.stringify(renderer.toJSON())).toContain('Silence ON');

      await ReactTestRenderer.act(() => {
        useSilenceStore.setState({ state: 'blocked', granted: false });
      });
      expect(JSON.stringify(renderer.toJSON())).toContain(
        'Silence needs permission - tap to fix',
      );

      await ReactTestRenderer.act(() => {
        useSilenceStore.setState({ state: 'already_quiet', granted: true });
      });
      expect(JSON.stringify(renderer.toJSON())).toContain(
        'Already in Do Not Disturb',
      );
    });
  });

  describe('SilencePermissionStep (onboarding.steps)', () => {
    it('shows Open settings + Skip for now when not granted, and Access granted + Continue when granted', async () => {
      const onContinue = jest.fn();
      const onSkip = jest.fn();
      useSilenceStore.setState({ granted: false });

      const renderer = await render(
        <SilencePermissionStep
          onContinue={onContinue}
          onSkip={onSkip}
          isLast={false}
        />,
      );

      const beforeJson = JSON.stringify(renderer.toJSON());
      expect(beforeJson).toContain('Stay in the zone');
      expect(beforeJson).toContain('Open settings');
      expect(beforeJson).toContain('Skip for now');

      await ReactTestRenderer.act(() => {
        useSilenceStore.setState({ granted: true });
      });

      const afterJson = JSON.stringify(renderer.toJSON());
      expect(afterJson).toContain('Access granted');
      expect(afterJson).toContain('Continue');
    });
  });
});
