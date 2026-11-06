import { createFakeClock, systemClock } from '@/core/time/clock';

describe('Time Clock', () => {
  it('systemClock returns current timestamp', () => {
    const before = Date.now();
    const now = systemClock.now();
    const after = Date.now();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });

  it('createFakeClock initializes, advances, and sets time accurately', () => {
    const clock = createFakeClock(1000);
    expect(clock.now()).toBe(1000);

    clock.advance(500);
    expect(clock.now()).toBe(1500);

    clock.advance(-200);
    expect(clock.now()).toBe(1300);

    clock.set(5000);
    expect(clock.now()).toBe(5000);
  });
});

