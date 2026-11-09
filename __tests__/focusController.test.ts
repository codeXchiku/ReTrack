import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { eventBus } from '@/core/events';
import { createFakeClock } from '@/core/time';
import {
  type FocusStorage,
  focusController,
  getRemainingMs,
  lastConfigSetting,
  useFocusActive,
  useFocusNow,
  useFocusResult,
  useFocusStore,
  useFocusedMs,
  useProgress,
  useRemainingMs,
} from '@/features/focus';
import type { TimerConfig, TimerState } from '@/features/focus/logic/types';
import type { SaveSessionResult } from '@/features/sessions';

function createMockStorage(): FocusStorage & { map: Map<string, unknown> } {
  const map = new Map<string, unknown>();
  return {
    map,
    getJSON<T>(key: string): T | undefined {
      return map.get(key) as T | undefined;
    },
    setJSON<T>(key: string, value: T): void {
      map.set(key, value);
    },
    remove(key: string): void {
      map.delete(key);
    },
  };
}

describe('focusController & focusStore', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let fakeClock: ReturnType<typeof createFakeClock>;
  let mockSaveSession: jest.Mock<Promise<SaveSessionResult>>;

  const countdownConfig: TimerConfig = {
    mode: 'countdown',
    subjectId: 'sub_1',
    focusMs: 15 * 60 * 1000,
    breakMs: 0,
    longBreakMs: 0,
    rounds: 1,
    silence: true,
    keepAwake: false,
  };

  const pomodoroConfig: TimerConfig = {
    mode: 'pomodoro',
    subjectId: null,
    focusMs: 25 * 60 * 1000,
    breakMs: 5 * 60 * 1000,
    longBreakMs: 15 * 60 * 1000,
    rounds: 3,
    silence: false,
    keepAwake: false,
  };

  beforeEach(() => {
    mockStorage = createMockStorage();
    fakeClock = createFakeClock(1000000);
    mockSaveSession = jest.fn().mockResolvedValue({
      saved: true,
      streakBefore: 1,
      streakAfter: 2,
    });

    focusController._resetForTest();
    focusController.setClock(fakeClock);
    focusController.setStorage(mockStorage);
    focusController.setSaveSession(mockSaveSession as unknown as typeof import('@/features/sessions').saveSession);
  });

  afterEach(() => {
    focusController._resetForTest();
  });

  test('start -> creates active session, updates store, persists state, saves lastConfig, emits phaseStarted', () => {
    const events: unknown[] = [];
    const unsub = eventBus.on('focus/phaseStarted', e => events.push(e));

    const result = focusController.start(countdownConfig);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.state.sessionId).toBeDefined();
      expect(result.state.status).toBe('running');
      expect(result.state.phase).toBe('focus');
    }

    // Store state
    const active = useFocusStore.getState().active;
    expect(active).not.toBeNull();
    expect(active?.sessionId).toBe(result.ok ? result.state.sessionId : '');

    // MMKV persistence
    const persisted = mockStorage.getJSON<TimerState>('focus.activeState');
    expect(persisted).toBeDefined();
    expect(persisted?.sessionId).toBe(active?.sessionId);

    // Last config
    expect(lastConfigSetting.get()).toEqual(countdownConfig);
    expect(focusController.getLastConfig()).toEqual(countdownConfig);

    // Events
    expect(events.length).toBe(1);
    expect(events[0]).toMatchObject({
      sessionId: active?.sessionId,
      phase: 'focus',
      endsAt: 1000000 + 15 * 60 * 1000,
      silence: true,
    });

    unsub();
  });

  test('start while active is rejected with typed error (not a throw)', () => {
    const res1 = focusController.start(countdownConfig);
    expect(res1.ok).toBe(true);

    const res2 = focusController.start(countdownConfig);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.error).toBe('already_active');
    }
  });

  test('startLast uses last stored config', () => {
    lastConfigSetting.set(countdownConfig);
    const res = focusController.startLast();
    expect(res.ok).toBe(true);
    expect(useFocusStore.getState().active?.config.mode).toBe('countdown');
  });

  test('pause and resume emit typed events and persist state', async () => {
    const pausedEvents: unknown[] = [];
    const resumedEvents: unknown[] = [];
    const u1 = eventBus.on('focus/paused', e => pausedEvents.push(e));
    const u2 = eventBus.on('focus/resumed', e => resumedEvents.push(e));

    focusController.start(countdownConfig);

    fakeClock.advance(30000);
    await focusController.pause();

    expect(useFocusStore.getState().active?.status).toBe('paused');
    expect(mockStorage.getJSON<TimerState>('focus.activeState')?.status).toBe('paused');
    expect(pausedEvents.length).toBe(1);

    fakeClock.advance(10000); // 10s paused
    await focusController.resume();

    expect(useFocusStore.getState().active?.status).toBe('running');
    expect(mockStorage.getJSON<TimerState>('focus.activeState')?.status).toBe('running');
    expect(resumedEvents.length).toBe(1);
    expect(resumedEvents[0]).toMatchObject({
      phase: 'focus',
      silence: true,
    });

    u1();
    u2();
  });

  test('stop emits focus/stopped first, then saves session and emits focus/finished', async () => {
    const eventSequence: string[] = [];
    const u1 = eventBus.on('focus/stopped', () => eventSequence.push('stopped'));
    const u2 = eventBus.on('focus/finished', () => eventSequence.push('finished'));

    focusController.start(countdownConfig);
    fakeClock.advance(60000); // 1m elapsed

    await focusController.stop();

    expect(eventSequence).toEqual(['stopped', 'finished']);
    expect(mockSaveSession).toHaveBeenCalledTimes(1);
    expect(mockSaveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: 'sub_1',
        mode: 'countdown',
        focusedMs: 60000,
        completed: false,
      }),
      expect.any(Object),
    );

    // Active cleared
    expect(useFocusStore.getState().active).toBeNull();
    // MMKV removed
    expect(mockStorage.getJSON('focus.activeState')).toBeUndefined();

    // lastResult populated
    const result = useFocusStore.getState().lastResult;
    expect(result).not.toBeNull();
    expect(result?.focusedSecs).toBe(60);
    expect(result?.completed).toBe(false);
    expect(result?.saved).toBe(true);
    expect(result?.streakAfter).toBe(2);

    u1();
    u2();
  });

  test('pomodoro transitions: awaitingNext, startNext and skipBreak', async () => {
    const awaitingEvents: unknown[] = [];
    const u1 = eventBus.on('focus/awaitingNext', e => awaitingEvents.push(e));

    focusController.start(pomodoroConfig); // round 1 focus (25m)

    // Advance 25m to complete round 1 focus -> transitions to break
    fakeClock.advance(25 * 60 * 1000);
    await focusController.tick();
    expect(useFocusStore.getState().active?.phase).toBe('break');

    // Advance 5m for break to finish -> transitions to awaitingNext
    fakeClock.advance(5 * 60 * 1000);
    await focusController.tick();

    expect(useFocusStore.getState().active?.status).toBe('awaitingNext');
    expect(awaitingEvents.length).toBe(1);
    expect(awaitingEvents[0]).toMatchObject({ nextRound: 2 });

    // startNext() -> starts round 2 focus
    await focusController.startNext();
    expect(useFocusStore.getState().active?.status).toBe('running');
    expect(useFocusStore.getState().active?.round).toBe(2);
    expect(useFocusStore.getState().active?.phase).toBe('focus');

    // Complete round 2 focus -> enters round 2 break
    fakeClock.advance(25 * 60 * 1000);
    await focusController.tick();
    expect(useFocusStore.getState().active?.phase).toBe('break');

    // skipBreak() -> immediately skips break and enters round 3 focus
    await focusController.skipBreak();
    expect(useFocusStore.getState().active?.status).toBe('running');
    expect(useFocusStore.getState().active?.round).toBe(3);
    expect(useFocusStore.getState().active?.phase).toBe('focus');

    u1();
  });

  test('dismissResult clears lastResult', async () => {
    focusController.start(countdownConfig);
    await focusController.stop();
    expect(useFocusStore.getState().lastResult).not.toBeNull();

    focusController.dismissResult();
    expect(useFocusStore.getState().lastResult).toBeNull();
  });

  test('reactive hooks work in components', async () => {
    const realNow = Date.now();
    fakeClock.set(realNow);
    focusController.start(countdownConfig);

    let observedActive: unknown;
    let observedRemaining: unknown;
    let observedProgress: unknown;
    let observedFocused: unknown;
    let observedNow: unknown;
    let observedLastResult: unknown;

    const TestComponent = () => {
      observedActive = useFocusActive();
      observedRemaining = useRemainingMs();
      observedProgress = useProgress();
      observedFocused = useFocusedMs();
      observedNow = useFocusNow();
      observedLastResult = useFocusResult();
      return null;
    };

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(React.createElement(TestComponent));
    });

    expect(observedActive).not.toBeNull();
    expect(Number(observedRemaining)).toBeGreaterThan(0);
    expect(Number(observedRemaining)).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(Number(observedProgress)).toBeCloseTo(0, 2);
    expect(Number(observedFocused)).toBeLessThan(1000);
    expect(Number(observedNow)).toBeGreaterThan(0);
    expect(observedLastResult).toBeNull();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  describe('restore()', () => {
    test('restores running state with correct remaining time', async () => {
      // Start session, advance 30s, simulate kill
      focusController.start(countdownConfig);
      fakeClock.advance(30000);

      // Reset in-memory store simulating process death
      useFocusStore.getState().reset();
      expect(useFocusStore.getState().active).toBeNull();

      // Advance clock 40s while dead (total elapsed 70s out of 15m)
      fakeClock.advance(40000);

      const restored = await focusController.restore();
      expect(restored).not.toBeNull();
      expect(restored?.status).toBe('running');
      expect(useFocusStore.getState().hydrated).toBe(true);

      const remainingMs = getRemainingMs(restored!, fakeClock.now());
      expect(remainingMs).toBe(15 * 60 * 1000 - 70000);
    });

    test('state that expired while dead ends and saves session exactly once even if restore called twice', async () => {
      // Start 15m session
      focusController.start(countdownConfig);

      // Kill app, advance clock 20m (exceeding 15m focus)
      useFocusStore.getState().reset();
      fakeClock.advance(20 * 60 * 1000);

      const restored1 = await focusController.restore();
      expect(restored1).toBeNull();
      expect(mockSaveSession).toHaveBeenCalledTimes(1);
      expect(useFocusStore.getState().active).toBeNull();
      expect(mockStorage.getJSON('focus.activeState')).toBeUndefined();

      // Call restore a second time
      const restored2 = await focusController.restore();
      expect(restored2).toBeNull();
      expect(mockSaveSession).toHaveBeenCalledTimes(1); // Not saved again!
    });

    test('corrupt JSON or old shape is discarded without crashing', async () => {
      mockStorage.map.set('focus.activeState', '{ broken json');
      const r1 = await focusController.restore();
      expect(r1).toBeNull();
      expect(useFocusStore.getState().hydrated).toBe(true);

      mockStorage.map.set('focus.activeState', { old: 'shape', without: 'sessionId' });
      const r2 = await focusController.restore();
      expect(r2).toBeNull();
      expect(mockStorage.getJSON('focus.activeState')).toBeUndefined();
    });
  });
});
