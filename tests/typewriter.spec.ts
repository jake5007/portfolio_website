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
  globalThis.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
    if (!owned) return nativeSet(callback, delay, ...args);
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
