export type Clock = {
  now(): number;
};

export type FakeClock = Clock & {
  advance(ms: number): void;
  set(timestamp: number): void;
};

export const systemClock: Clock = {
  now(): number {
    return Date.now();
  },
};

export function createFakeClock(start = 0): FakeClock {
  let currentTime = start;

  return {
    now(): number {
      return currentTime;
    },
    advance(ms: number): void {
      currentTime += ms;
    },
    set(timestamp: number): void {
      currentTime = timestamp;
    },
  };
}

