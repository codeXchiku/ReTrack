import {
  applyAction,
  buildConfig,
  COUNTDOWN_PRESETS_MIN,
  DEFAULT_ROUNDS,
  getElapsedMs,
  getEndsAt,
  getFocusedMs,
  getProgress,
  getRemainingMs,
  isActive,
  longBreakFor,
  MAX_STOPWATCH_MS,
  POMODORO_PRESETS,
  startSession,
  type TimerAction,
  type TimerConfig,
  validateConfig,
} from '@/features/focus';

const M = 60 * 1000; // 1 minute in milliseconds
const H = 60 * M; // 1 hour in milliseconds

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('Timer Engine (Pure Logic)', () => {
  // Test 1: Countdown 25m
  test('1. Countdown 25m lifecycle, remaining and idempotence', () => {
    const config = buildConfig({ mode: 'countdown', focusMs: 25 * M });
    const t0 = 1_000_000;
    const { state: s0, effects: eff0 } = startSession(config, t0, 'session-cd');

    expect(s0.status).toBe('running');
    expect(s0.phase).toBe('focus');
    expect(s0.round).toBe(1);
    expect(eff0).toEqual([
      {
        type: 'phaseStarted',
        phase: 'focus',
        round: 1,
        endsAt: t0 + 25 * M,
      },
    ]);

    // At +10m: remaining is 15m, progress is 10/25 = 0.4
    const t10 = t0 + 10 * M;
    expect(getElapsedMs(s0, t10)).toBe(10 * M);
    expect(getRemainingMs(s0, t10)).toBe(15 * M);
    expect(getProgress(s0, t10)).toBeCloseTo(0.4, 5);
    expect(getFocusedMs(s0, t10)).toBe(10 * M);
    expect(getEndsAt(s0)).toBe(t0 + 25 * M);
    expect(isActive(s0)).toBe(true);

    // At +25m: tick triggers session completion
    const t25 = t0 + 25 * M;
    const { state: sFinished, effects: effFinished } = applyAction(
      s0,
      { type: 'tick' },
      t25,
    );

    expect(sFinished.status).toBe('finished');
    expect(sFinished.completed).toBe(true);
    expect(sFinished.focusedMsDone).toBe(25 * M);
    expect(sFinished.endedAt).toBe(t25);
    expect(effFinished).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: 25 * M,
        completed: true,
      },
    ]);
    expect(isActive(sFinished)).toBe(false);

    // Tick again at +30m is idempotent: returns same state and no new effects
    const { state: sAgain, effects: effAgain } = applyAction(
      sFinished,
      { type: 'tick' },
      t0 + 30 * M,
    );
    expect(sAgain).toEqual(sFinished);
    expect(effAgain).toEqual([]);
  });

  // Test 2: Pause and Resume
  test('2. Pause and resume maintains exact elapsed and remaining time', () => {
    const config = buildConfig({ mode: 'countdown', focusMs: 25 * M });
    const t0 = 1_000_000;
    const { state: s0 } = startSession(config, t0, 'session-pr');

    // Run 5m -> Pause at t0 + 5m
    const t5 = t0 + 5 * M;
    const { state: sPaused, effects: effPause } = applyAction(
      s0,
      { type: 'pause' },
      t5,
    );
    expect(sPaused.status).toBe('paused');
    expect(sPaused.segmentStartedAt).toBeNull();
    expect(sPaused.elapsedBeforeMs).toBe(5 * M);
    expect(effPause).toEqual([{ type: 'paused' }]);
    expect(getElapsedMs(sPaused, t5)).toBe(5 * M);
    expect(getRemainingMs(sPaused, t5)).toBe(20 * M);

    // While paused for 2 hours, getFocusedMs and elapsed do not grow
    const t2hLater = t5 + 2 * H;
    expect(getElapsedMs(sPaused, t2hLater)).toBe(5 * M);
    expect(getFocusedMs(sPaused, t2hLater)).toBe(5 * M);
    expect(getEndsAt(sPaused)).toBeNull();

    // Resume at t2hLater
    const { state: sResumed, effects: effResume } = applyAction(
      sPaused,
      { type: 'resume' },
      t2hLater,
    );
    expect(sResumed.status).toBe('running');
    expect(sResumed.segmentStartedAt).toBe(t2hLater);
    expect(effResume).toEqual([
      {
        type: 'resumed',
        phase: 'focus',
        endsAt: t2hLater + 20 * M,
      },
    ]);

    // Run 5m after resume -> total elapsed is exactly 10m, remaining is 15m
    const tAfter5 = t2hLater + 5 * M;
    expect(getElapsedMs(sResumed, tAfter5)).toBe(10 * M);
    expect(getRemainingMs(sResumed, tAfter5)).toBe(15 * M);
    expect(getFocusedMs(sResumed, tAfter5)).toBe(10 * M);
  });

  // Test 3: Pomodoro 25/5 x4 full walkthrough
  test('3. Pomodoro 25/5 x4 walkthrough with exact boundaries and long break', () => {
    const config = buildConfig({
      mode: 'pomodoro',
      focusMs: 25 * M,
      breakMs: 5 * M,
      longBreakMs: 15 * M,
      rounds: 4,
    });
    let time = 1_000_000;
    const { state: sStart, effects: effStart } = startSession(config, time, 'pomo-4');
    let state = sStart;
    expect(effStart).toEqual([
      { type: 'phaseStarted', phase: 'focus', round: 1, endsAt: time + 25 * M },
    ]);

    // Round 1
    time += 25 * M;
    let res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.phase).toBe('break');
    expect(state.round).toBe(1);
    expect(res.effects).toEqual([
      { type: 'phaseStarted', phase: 'break', round: 1, endsAt: time + 5 * M },
    ]);

    time += 5 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.status).toBe('awaitingNext');
    expect(res.effects).toEqual([{ type: 'awaitingNext', nextRound: 2 }]);

    res = applyAction(state, { type: 'startNext' }, time);
    state = res.state;
    expect(state.status).toBe('running');
    expect(state.phase).toBe('focus');
    expect(state.round).toBe(2);
    expect(res.effects).toEqual([
      { type: 'phaseStarted', phase: 'focus', round: 2, endsAt: time + 25 * M },
    ]);

    // Round 2
    time += 25 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.phase).toBe('break');
    expect(state.round).toBe(2);

    time += 5 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.status).toBe('awaitingNext');
    expect(res.effects).toEqual([{ type: 'awaitingNext', nextRound: 3 }]);

    res = applyAction(state, { type: 'startNext' }, time);
    state = res.state;
    expect(state.round).toBe(3);

    // Round 3
    time += 25 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.phase).toBe('break');

    time += 5 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.status).toBe('awaitingNext');
    expect(res.effects).toEqual([{ type: 'awaitingNext', nextRound: 4 }]);

    res = applyAction(state, { type: 'startNext' }, time);
    state = res.state;
    expect(state.round).toBe(4);

    // Round 4 (Final round) -> ends in long break (15m)
    time += 25 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.phase).toBe('longBreak');
    expect(state.round).toBe(4);
    expect(res.effects).toEqual([
      { type: 'phaseStarted', phase: 'longBreak', round: 4, endsAt: time + 15 * M },
    ]);

    // Long break completes -> sessionFinished
    time += 15 * M;
    res = applyAction(state, { type: 'tick' }, time);
    state = res.state;
    expect(state.status).toBe('finished');
    expect(state.completed).toBe(true);
    expect(state.focusedMsDone).toBe(100 * M);
    expect(res.effects).toEqual([
      { type: 'sessionFinished', focusedMs: 100 * M, completed: true },
    ]);
  });

  // Test 4: App-slept case & chained ticks
  test('4. App-slept case chains phases correctly across long sleep jumps', () => {
    const config = buildConfig({
      mode: 'pomodoro',
      focusMs: 25 * M,
      breakMs: 5 * M,
      rounds: 4,
    });
    const t0 = 1_000_000;
    const { state: s0 } = startSession(config, t0, 'slept');

    // Jump now to +27m in a single tick (slept through focus and 2m into break)
    const t27 = t0 + 27 * M;
    const { state: s27, effects: eff27 } = applyAction(s0, { type: 'tick' }, t27);

    expect(s27.status).toBe('running');
    expect(s27.phase).toBe('break');
    expect(s27.round).toBe(1);
    expect(s27.focusedMsDone).toBe(25 * M);
    expect(s27.segmentStartedAt).toBe(t0 + 25 * M);
    expect(getElapsedMs(s27, t27)).toBe(2 * M);
    expect(getRemainingMs(s27, t27)).toBe(3 * M);
    expect(eff27).toEqual([
      {
        type: 'phaseStarted',
        phase: 'break',
        round: 1,
        endsAt: t0 + 30 * M,
      },
    ]);

    // Jump now to +40m in a single tick (slept through remainder of break)
    const { state: sAwaiting, effects: eff40 } = applyAction(
      s27,
      { type: 'tick' },
      t0 + 40 * M,
    );
    expect(sAwaiting.status).toBe('awaitingNext');
    expect(eff40).toEqual([{ type: 'awaitingNext', nextRound: 2 }]);

    // Jump 10 hours in one tick from t0: verify it halts at awaitingNext
    const { state: sFresh } = startSession(config, t0, 'slept-10h');
    const { state: s10h, effects: eff10h } = applyAction(
      sFresh,
      { type: 'tick' },
      t0 + 10 * H,
    );
    expect(s10h.status).toBe('awaitingNext');
    expect(s10h.focusedMsDone).toBe(25 * M); // Only completed focus phase counts
    expect(eff10h).toEqual([
      { type: 'phaseStarted', phase: 'break', round: 1, endsAt: t0 + 30 * M },
      { type: 'awaitingNext', nextRound: 2 },
    ]);
  });

  // Test 5: skipBreak and invalid startNext
  test('5. skipBreak starts next focus from break and finishes from longBreak', () => {
    const config = buildConfig({
      mode: 'pomodoro',
      focusMs: 25 * M,
      breakMs: 5 * M,
      longBreakMs: 15 * M,
      rounds: 2,
    });
    const t0 = 1_000_000;
    const { state: s0 } = startSession(config, t0, 'skip-test');

    // startNext in running focus does nothing
    const invalidStart = applyAction(s0, { type: 'startNext' }, t0 + 5 * M);
    expect(invalidStart.state).toEqual(s0);
    expect(invalidStart.effects).toEqual([]);

    // Advance to round 1 break
    const { state: sBreak } = applyAction(s0, { type: 'tick' }, t0 + 25 * M);
    expect(sBreak.phase).toBe('break');

    // Skip break at +27m -> starts round 2 focus immediately running from +27m
    const t27 = t0 + 27 * M;
    const { state: sRound2, effects: effSkipBreak } = applyAction(
      sBreak,
      { type: 'skipBreak' },
      t27,
    );
    expect(sRound2.status).toBe('running');
    expect(sRound2.phase).toBe('focus');
    expect(sRound2.round).toBe(2);
    expect(sRound2.segmentStartedAt).toBe(t27);
    expect(effSkipBreak).toEqual([
      {
        type: 'phaseStarted',
        phase: 'focus',
        round: 2,
        endsAt: t27 + 25 * M,
      },
    ]);

    // Complete round 2 focus -> enters long break
    const { state: sLongBreak } = applyAction(
      sRound2,
      { type: 'tick' },
      t27 + 25 * M,
    );
    expect(sLongBreak.phase).toBe('longBreak');

    // Skip long break -> finishes session as completed
    const tSkipLong = t27 + 30 * M;
    const { state: sDone, effects: effSkipLong } = applyAction(
      sLongBreak,
      { type: 'skipBreak' },
      tSkipLong,
    );
    expect(sDone.status).toBe('finished');
    expect(sDone.completed).toBe(true);
    expect(sDone.focusedMsDone).toBe(50 * M);
    expect(effSkipLong).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: 50 * M,
        completed: true,
      },
    ]);
  });

  // Test 6: stop action semantics and stopwatch cap
  test('6. stop records partial focus, stopwatch completes true, 12h safety cap', () => {
    // 6a: Stop during focus at +10m of 25m pomodoro
    const pomoConfig = buildConfig({ mode: 'pomodoro', focusMs: 25 * M });
    const t0 = 1_000_000;
    const { state: sPomo } = startSession(pomoConfig, t0, 'stop-pomo');

    const { state: sStoppedFocus, effects: effStopFocus } = applyAction(
      sPomo,
      { type: 'stop' },
      t0 + 10 * M,
    );
    expect(sStoppedFocus.status).toBe('finished');
    expect(sStoppedFocus.completed).toBe(false);
    expect(sStoppedFocus.focusedMsDone).toBe(10 * M);
    expect(effStopFocus).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: 10 * M,
        completed: false,
      },
    ]);

    // 6b: Stop during break -> focusedMs is only completed focus
    const { state: sPomo2 } = startSession(pomoConfig, t0, 'stop-break');
    const { state: sInBreak } = applyAction(sPomo2, { type: 'tick' }, t0 + 25 * M);
    const { state: sStoppedBreak, effects: effStopBreak } = applyAction(
      sInBreak,
      { type: 'stop' },
      t0 + 27 * M,
    );
    expect(sStoppedBreak.status).toBe('finished');
    expect(sStoppedBreak.completed).toBe(false);
    expect(sStoppedBreak.focusedMsDone).toBe(25 * M);
    expect(effStopBreak).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: 25 * M,
        completed: false,
      },
    ]);

    // 6c: Stopwatch stop at +30m -> completed = true, focused = 30m
    const swConfig = buildConfig({ mode: 'stopwatch' });
    const { state: sSw } = startSession(swConfig, t0, 'stop-sw');
    expect(sSw.phaseDurationMs).toBeNull();
    expect(getRemainingMs(sSw, t0 + 10 * M)).toBeNull();
    expect(getProgress(sSw, t0 + 10 * M)).toBeNull();

    const { state: sSwStopped, effects: effSwStop } = applyAction(
      sSw,
      { type: 'stop' },
      t0 + 30 * M,
    );
    expect(sSwStopped.status).toBe('finished');
    expect(sSwStopped.completed).toBe(true);
    expect(sSwStopped.focusedMsDone).toBe(30 * M);
    expect(effSwStop).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: 30 * M,
        completed: true,
      },
    ]);

    // 6d: Stopwatch safety cap at 12 hours
    const { state: sSwCap } = startSession(swConfig, t0, 'sw-cap');
    const { state: sSwCapped, effects: effSwCap } = applyAction(
      sSwCap,
      { type: 'tick' },
      t0 + 13 * H,
    );
    expect(sSwCapped.status).toBe('finished');
    expect(sSwCapped.completed).toBe(true);
    expect(sSwCapped.focusedMsDone).toBe(MAX_STOPWATCH_MS);
    expect(effSwCap).toEqual([
      {
        type: 'sessionFinished',
        focusedMs: MAX_STOPWATCH_MS,
        completed: true,
      },
    ]);
  });

  // Test 7: Clock backwards, validation, boundary values, rounds = 1
  test('7. Clock backwards safety, validateConfig ranges, and rounds=1', () => {
    // 7a: Clock going backwards
    const config = buildConfig({ mode: 'countdown', focusMs: 25 * M });
    const t0 = 1_000_000;
    const { state: s0 } = startSession(config, t0, 'clock-backwards');

    // now jumps backwards to t0 - 500ms
    const tBack = t0 - 500;
    expect(getElapsedMs(s0, tBack)).toBe(0);
    expect(getRemainingMs(s0, tBack)).toBe(25 * M);
    expect(getFocusedMs(s0, tBack)).toBe(0);

    const { state: sTickBack } = applyAction(s0, { type: 'tick' }, tBack);
    expect(sTickBack.status).toBe('running');

    // 7b: validateConfig rejects invalid values
    expect(
      validateConfig({
        ...config,
        focusMs: 0,
      }).ok,
    ).toBe(false);

    expect(
      validateConfig({
        ...config,
        focusMs: -1000,
      }).ok,
    ).toBe(false);

    expect(
      validateConfig({
        ...config,
        focusMs: Number.NaN,
      }).ok,
    ).toBe(false);

    // Countdown range 1..600 min
    expect(validateConfig({ ...config, focusMs: 1 * M }).ok).toBe(true);
    expect(validateConfig({ ...config, focusMs: 600 * M }).ok).toBe(true);
    expect(validateConfig({ ...config, focusMs: 601 * M }).ok).toBe(false);

    // Pomodoro range
    const pomoBase: TimerConfig = {
      mode: 'pomodoro',
      subjectId: null,
      focusMs: 25 * M,
      breakMs: 5 * M,
      longBreakMs: 15 * M,
      rounds: 4,
      silence: false,
      keepAwake: false,
    };
    expect(validateConfig({ ...pomoBase, focusMs: 180 * M }).ok).toBe(true);
    expect(validateConfig({ ...pomoBase, focusMs: 181 * M }).ok).toBe(false);
    expect(validateConfig({ ...pomoBase, breakMs: 60 * M }).ok).toBe(true);
    expect(validateConfig({ ...pomoBase, breakMs: 61 * M }).ok).toBe(false);
    expect(validateConfig({ ...pomoBase, rounds: 1 }).ok).toBe(true);
    expect(validateConfig({ ...pomoBase, rounds: 8 }).ok).toBe(true);
    expect(validateConfig({ ...pomoBase, rounds: 9 }).ok).toBe(false);
    expect(validateConfig({ ...pomoBase, rounds: 0 }).ok).toBe(false);

    // Helper functions
    expect(longBreakFor(5 * M)).toBe(15 * M);
    expect(longBreakFor(15 * M)).toBe(30 * M); // Capped at 30 min
    expect(POMODORO_PRESETS.length).toBe(2);
    expect(COUNTDOWN_PRESETS_MIN).toEqual([15, 30, 45, 60]);
    expect(DEFAULT_ROUNDS).toBe(4);

    // 7c: rounds = 1 (focus -> long break -> finished)
    const singleRoundConfig = buildConfig({
      mode: 'pomodoro',
      focusMs: 25 * M,
      breakMs: 5 * M,
      longBreakMs: 15 * M,
      rounds: 1,
    });
    const { state: sR1 } = startSession(singleRoundConfig, t0, 'r1');
    const { state: sR1Long } = applyAction(sR1, { type: 'tick' }, t0 + 25 * M);
    expect(sR1Long.phase).toBe('longBreak');

    const { state: sR1Finished } = applyAction(
      sR1Long,
      { type: 'tick' },
      t0 + 40 * M,
    );
    expect(sR1Finished.status).toBe('finished');
    expect(sR1Finished.completed).toBe(true);
    expect(sR1Finished.focusedMsDone).toBe(25 * M);
  });

  // Test 8: Immutability (deep-freeze input state)
  test('8. State immutability: deep-frozen inputs are never mutated', () => {
    const config = buildConfig({ mode: 'pomodoro', focusMs: 25 * M, breakMs: 5 * M });
    const t0 = 1_000_000;
    const { state: s0 } = startSession(config, t0, 'freeze-test');

    const frozen = deepFreeze({ ...s0 });
    expect(() => applyAction(frozen, { type: 'tick' }, t0 + 10 * M)).not.toThrow();
    expect(() => applyAction(frozen, { type: 'pause' }, t0 + 10 * M)).not.toThrow();
    expect(() => applyAction(frozen, { type: 'stop' }, t0 + 10 * M)).not.toThrow();
    expect(() => applyAction(frozen, { type: 'startNext' }, t0 + 10 * M)).not.toThrow();
    expect(() => applyAction(frozen, { type: 'skipBreak' }, t0 + 10 * M)).not.toThrow();
  });

  // Test 9: Randomized / Property test
  test('9. Randomized property test preserves all invariants over 200 actions', () => {
    const config = buildConfig({
      mode: 'pomodoro',
      focusMs: 10 * M,
      breakMs: 2 * M,
      longBreakMs: 5 * M,
      rounds: 3,
    });
    let time = 1_000_000;
    const { state: initial } = startSession(config, time, 'property-test');
    let state = initial;
    let prevFocused = getFocusedMs(state, time);

    const actionTypes: TimerAction['type'][] = [
      'tick',
      'tick',
      'tick',
      'pause',
      'resume',
      'startNext',
      'skipBreak',
      'stop',
    ];

    for (let i = 0; i < 200; i++) {
      // Advance time by a random delta between 0 and 3 minutes
      time += Math.floor(Math.random() * 3 * M);
      const chosenType =
        actionTypes[Math.floor(Math.random() * actionTypes.length)] ?? 'tick';
      const action: TimerAction = { type: chosenType };

      deepFreeze(state);
      const res = applyAction(state, action, time);
      const nextState = res.state;

      // Invariant 1: Remaining is never negative or NaN
      const remaining = getRemainingMs(nextState, time);
      if (remaining !== null) {
        expect(remaining).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(remaining)).toBe(true);
      }

      // Invariant 2: Progress is 0..1 or null
      const progress = getProgress(nextState, time);
      if (progress !== null) {
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
      }

      // Invariant 3: FocusedMs never decreases
      const currFocused = getFocusedMs(nextState, time);
      expect(currFocused).toBeGreaterThanOrEqual(prevFocused);
      prevFocused = currFocused;

      // Invariant 4: Finished is terminal
      if (state.status === 'finished') {
        expect(nextState.status).toBe('finished');
        expect(res.effects).toEqual([]);
      }

      state = nextState;
    }
  });
});
