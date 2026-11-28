import { AppState, type AppStateStatus } from 'react-native';
import { eventBus } from '@/core/events';
import { focusController, type TimerState } from '@/features/focus';
import {
  silenceService,
  STOPWATCH_CAP_MS,
  useSilenceStore,
  type DndNativeModule,
  type DndStatus,
} from '@/features/silence';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeMockNative(overrides: Partial<DndNativeModule> = {}): DndNativeModule {
  return {
    isPolicyAccessGranted: jest.fn(async () => true),
    openPolicyAccessSettings: jest.fn(async () => {}),
    getStatus: jest.fn(
      async (): Promise<DndStatus> => ({
        granted: true,
        currentFilter: 1,
        ownedByApp: false,
        endsAt: 0,
      }),
    ),
    enter: jest.fn(async () => 'applied' as const),
    exit: jest.fn(async () => 'restored' as const),
    ...overrides,
  };
}

function makeActiveState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    sessionId: 'sess-1',
    config: {
      mode: 'countdown',
      subjectId: null,
      focusMs: 600_000,
      breakMs: 0,
      longBreakMs: 0,
      rounds: 1,
      silence: true,
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
    ...overrides,
  };
}

describe('silenceService & useSilenceStore', () => {
  let appStateListeners: ((state: AppStateStatus) => void)[] = [];
  let addEventListenerSpy: jest.SpyInstance;
  let getActiveSpy: jest.SpyInstance;

  beforeEach(() => {
    appStateListeners = [];
    addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, handler) => {
        appStateListeners.push(handler as (state: AppStateStatus) => void);
        return { remove: jest.fn() };
      });
    getActiveSpy = jest.spyOn(focusController, 'getActive').mockReturnValue(null);
    silenceService._resetForTest();
  });

  afterEach(() => {
    silenceService._resetForTest();
    addEventListenerSpy.mockRestore();
    getActiveSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('serial queue ordering', () => {
    it('executes enter then exit issued simultaneously in strict FIFO order and ends in exit', async () => {
      const callOrder: string[] = [];
      const enterDeferred = createDeferred<'applied'>();

      const mockNative = makeMockNative({
        enter: jest.fn(() => {
          callOrder.push('enter:start');
          return enterDeferred.promise.then(res => {
            callOrder.push('enter:end');
            return res;
          });
        }),
        exit: jest.fn(async () => {
          callOrder.push('exit:start');
          callOrder.push('exit:end');
          return 'restored';
        }),
      });

      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      // Emit enter and exit synchronously back-to-back without awaiting enter
      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 2_000_000,
        silence: true,
      });
      eventBus.emit('focus/paused', { sessionId: 's1' });

      // Exit must NOT have started while enter is still pending
      await Promise.resolve();
      expect(callOrder).toEqual(['enter:start']);

      // Now resolve enter
      enterDeferred.resolve('applied');
      // Wait for queued exit microtasks to flush
      await silenceService.enqueue(async () => {});

      expect(callOrder).toEqual([
        'enter:start',
        'enter:end',
        'exit:start',
        'exit:end',
      ]);
      expect(useSilenceStore.getState().state).toBe('idle');
    });
  });

  describe('store transitions via bus events', () => {
    it('transitions idle -> active -> idle across phaseStarted, paused, resumed, stopped', async () => {
      const mockNative = makeMockNative();
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      expect(useSilenceStore.getState()).toMatchObject({
        granted: true,
        state: 'idle',
      });

      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 500_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(mockNative.enter).toHaveBeenCalledWith(500_000);
      expect(useSilenceStore.getState().state).toBe('active');

      eventBus.emit('focus/paused', { sessionId: 's1' });
      await silenceService.enqueue(async () => {});
      expect(mockNative.exit).toHaveBeenCalledTimes(1);
      expect(useSilenceStore.getState().state).toBe('idle');

      eventBus.emit('focus/resumed', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 600_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(mockNative.enter).toHaveBeenLastCalledWith(600_000);
      expect(useSilenceStore.getState().state).toBe('active');

      eventBus.emit('focus/stopped', { sessionId: 's1' });
      await silenceService.enqueue(async () => {});
      expect(mockNative.exit).toHaveBeenCalledTimes(2);
      expect(useSilenceStore.getState().state).toBe('idle');
    });

    it('transitions to already_quiet when native returns already_quiet', async () => {
      const mockNative = makeMockNative({
        enter: jest.fn(async () => 'already_quiet'),
      });
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 500_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});

      expect(useSilenceStore.getState()).toMatchObject({
        granted: true,
        state: 'already_quiet',
      });
    });

    it('transitions to blocked when permission is missing (not_granted)', async () => {
      const mockNative = makeMockNative({
        isPolicyAccessGranted: jest.fn(async () => false),
        getStatus: jest.fn(async () => ({
          granted: false,
          currentFilter: 1,
          ownedByApp: false,
          endsAt: 0,
        })),
        enter: jest.fn(async () => 'not_granted'),
      });
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 500_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});

      expect(useSilenceStore.getState()).toMatchObject({
        granted: false,
        state: 'blocked',
      });
    });

    it('uses now + 12h cap for stopwatch (endsAt null)', async () => {
      const mockNative = makeMockNative();
      silenceService._setNativeForTest(mockNative);
      silenceService._setNowForTest(() => 10_000);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 'sw1',
        phase: 'focus',
        endsAt: null,
        silence: true,
      });
      await silenceService.enqueue(async () => {});

      expect(mockNative.enter).toHaveBeenCalledWith(10_000 + STOPWATCH_CAP_MS);
    });

    it('never calls enter when silence is false', async () => {
      const mockNative = makeMockNative();
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 500_000,
        silence: false,
      });
      await silenceService.enqueue(async () => {});

      expect(mockNative.enter).not.toHaveBeenCalled();
      expect(useSilenceStore.getState().state).toBe('idle');
    });

    it('exits during pomodoro break/longBreak and awaitingNext', async () => {
      const mockNative = makeMockNative();
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 'p1',
        phase: 'focus',
        endsAt: 500_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(useSilenceStore.getState().state).toBe('active');

      eventBus.emit('focus/phaseStarted', {
        sessionId: 'p1',
        phase: 'break',
        endsAt: 600_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(mockNative.exit).toHaveBeenCalledTimes(1);
      expect(useSilenceStore.getState().state).toBe('idle');

      // Resuming a break phase stays idle (does not enter)
      eventBus.emit('focus/resumed', {
        sessionId: 'p1',
        phase: 'break',
        endsAt: 650_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(mockNative.enter).toHaveBeenCalledTimes(1);

      eventBus.emit('focus/awaitingNext', { sessionId: 'p1', nextRound: 2 });
      await silenceService.enqueue(async () => {});
      expect(mockNative.exit).toHaveBeenCalledTimes(2);
    });
  });

  describe('safety nets', () => {
    it('launch: exits if ownedByApp=true and no active focus-phase silence session exists', async () => {
      const mockNative = makeMockNative({
        getStatus: jest.fn(async () => ({
          granted: true,
          currentFilter: 2,
          ownedByApp: true,
          endsAt: 999,
        })),
      });
      getActiveSpy.mockReturnValue(null);
      silenceService._setNativeForTest(mockNative);

      await silenceService.init();

      expect(mockNative.exit).toHaveBeenCalledTimes(1);
      expect(mockNative.enter).not.toHaveBeenCalled();
      expect(useSilenceStore.getState().state).toBe('idle');
    });

    it('launch: re-enters idempotently if ownedByApp=true and active focus-phase silence session exists', async () => {
      const active = makeActiveState({
        segmentStartedAt: 1_000_000,
        phaseDurationMs: 600_000,
        elapsedBeforeMs: 100_000,
      });
      getActiveSpy.mockReturnValue(active);

      const mockNative = makeMockNative({
        getStatus: jest.fn(async () => ({
          granted: true,
          currentFilter: 2,
          ownedByApp: true,
          endsAt: 1_500_000,
        })),
      });
      silenceService._setNativeForTest(mockNative);

      await silenceService.init();

      expect(mockNative.enter).toHaveBeenCalledWith(1_500_000);
      expect(mockNative.exit).not.toHaveBeenCalled();
      expect(useSilenceStore.getState().state).toBe('active');
    });

    it('foreground AppState active: calls enter when permission was just granted during running focus', async () => {
      let currentGranted = false;
      const mockNative = makeMockNative({
        isPolicyAccessGranted: jest.fn(async () => currentGranted),
        getStatus: jest.fn(async () => ({
          granted: currentGranted,
          currentFilter: 1,
          ownedByApp: false,
          endsAt: 0,
        })),
      });

      const active = makeActiveState({
        segmentStartedAt: 2_000_000,
        phaseDurationMs: 300_000,
        elapsedBeforeMs: 0,
      });
      getActiveSpy.mockReturnValue(active);
      silenceService._setNativeForTest(mockNative);

      await silenceService.init();
      expect(useSilenceStore.getState()).toMatchObject({
        granted: false,
        state: 'blocked',
      });

      // User grants permission in system settings and returns to foreground
      currentGranted = true;
      for (const listener of appStateListeners) {
        listener('active');
      }
      await silenceService.enqueue(async () => {});

      expect(mockNative.enter).toHaveBeenCalledWith(2_300_000);
      expect(useSilenceStore.getState()).toMatchObject({
        granted: true,
        state: 'active',
      });
    });

    it('fails softly to blocked if permission is revoked mid-session without crashing or looping', async () => {
      const mockNative = makeMockNative({
        enter: jest.fn(async () => 'not_granted'),
        exit: jest.fn(async () => 'error'),
        isPolicyAccessGranted: jest.fn(async () => false),
        getStatus: jest.fn(async () => ({
          granted: false,
          currentFilter: 1,
          ownedByApp: false,
          endsAt: 0,
        })),
      });
      silenceService._setNativeForTest(mockNative);
      await silenceService.init();

      eventBus.emit('focus/phaseStarted', {
        sessionId: 's1',
        phase: 'focus',
        endsAt: 500_000,
        silence: true,
      });
      await silenceService.enqueue(async () => {});
      expect(useSilenceStore.getState().state).toBe('blocked');
      expect(mockNative.enter).toHaveBeenCalledTimes(1);

      eventBus.emit('focus/stopped', { sessionId: 's1' });
      await silenceService.enqueue(async () => {});
      expect(useSilenceStore.getState().state).toBe('blocked');
      expect(mockNative.exit).toHaveBeenCalledTimes(1);
    });
  });
});
