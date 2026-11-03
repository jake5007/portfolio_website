import { expect, test } from "@playwright/test";
import { startTypewriter } from "../lib/typewriter";

// Observe real, public Node timers owned by the animation and its callbacks.
// Other test-runner timers are passed through without being counted.
function trackAnimationTimers() {
  const nativeSet = globalThis.setTimeout;
  const nativeClear = globalThis.clearTimeout;
  const pending = new Set<ReturnType<typeof setTimeout>>();
  let owned = false;
  let callbacks = 0;
  const delays: number[] = [];
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
    if (!owned) return nativeSet(callback, delay, ...args);
    delays.push(delay ?? 0);
    const timer = nativeSet(() => {
      pending.delete(timer);
      callbacks++;
      const previous = owned;
      owned = true;
      try { callback(...args); } finally { owned = previous; }
    }, delay);
    pending.add(timer);
    return timer;
  }) as typeof setTimeout;
  globalThis.clearTimeout = ((timer: ReturnType<typeof setTimeout>) => {
    pending.delete(timer);
    nativeClear(timer);
  }) as typeof clearTimeout;
  return {
    pending,
    delays,
    get callbacks() { return callbacks; },
    wait: (ms: number) => new Promise<void>(resolve => nativeSet(resolve, ms)),
    start(onText: (text: string) => void) {
      owned = true;
      try { return startTypewriter(onText); } finally { owned = false; }
    },
    restore() {
      Array.from(pending).forEach(nativeClear);
      globalThis.setTimeout = nativeSet;
      globalThis.clearTimeout = nativeClear;
    },
  };
}

test("typing and deletion sample the original random delay while word pauses stay fixed", async () => {
  const timers = trackAnimationTimers();
  const nativeRandom = Math.random;
  let stop: (() => void) | undefined;
  try {
    const texts: string[] = [];
    Math.random = () => 0;
    stop = timers.start(text => texts.push(text));
    expect(timers.delays[0]).toBe(25);
    Math.random = () => 0.999;
    await expect.poll(() => texts.includes("현진"), { timeout: 2000 }).toBe(true);
    expect(timers.delays[1]).toBeCloseTo(74.95);
    expect(timers.delays[2]).toBe(1500);
    Math.random = () => 0.5;
    await expect.poll(() => texts.includes(""), { timeout: 2500 }).toBe(true);
    expect(timers.delays.slice(3, 5)).toEqual([50, 50]);
    stop();
    expect(timers.pending.size).toBe(0);
  } finally {
    stop?.();
    Math.random = nativeRandom;
    timers.restore();
  }
});

for (const phase of ["before first tick", "during word pause"] as const) {
  test(`typewriter cancels its actual timer ${phase}, including repeated starts`, async () => {
    const timers = trackAnimationTimers();
    try {
      for (let cycle = 0; cycle < 3; cycle++) {
        const texts: string[] = [];
        const stop = timers.start(text => { texts.push(text); });
        expect(timers.pending.size).toBe(1);
        if (phase === "during word pause") {
          await expect.poll(() => texts.includes("현진"), { timeout: 2000 }).toBe(true);
        }
        stop();
        stop(); // Cleanup is safe more than once (including React remounts).
        expect(timers.pending.size).toBe(0);
        const callsAtStop = timers.callbacks;
        const textAtStop = texts.slice();
        await timers.wait(150);
        expect(timers.callbacks).toBe(callsAtStop);
        expect(texts).toEqual(textAtStop);
        expect(timers.pending.size).toBe(0);
      }
    } finally {
      timers.restore();
    }
  });
}
