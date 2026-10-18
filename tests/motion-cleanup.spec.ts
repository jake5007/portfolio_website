import { expect, test, type Page } from "@playwright/test";

// Keep the removed node alive deliberately: disappearance alone cannot detect
// an animation that keeps mutating detached DOM after React unmounts it.
async function observeTyping(page: Page) {
  return page.locator(".motion-typing > span").evaluateHandle(node => {
    const state = { node, mutations: 0 };
    const observer = new MutationObserver(records => { state.mutations += records.length; });
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    return { state, observer };
  });
}

test.use({ reducedMotion: "no-preference" });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/send", route => route.abort());
  await page.clock.install();
  await page.goto("/", { waitUntil: "networkidle" });
  await page.clock.runFor(500);
});

for (const reason of ["stop button", "reduced-motion preference"] as const) {
  test(`typing releases detached nodes after repeated unmounts via ${reason}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const observed: Awaited<ReturnType<typeof observeTyping>>[] = [];
    try {
      for (let cycle = 0; cycle < 3; cycle++) {
        const typing = page.locator(".motion-typing > span");
        await expect(typing).not.toHaveText("");
        const handle = await observeTyping(page);
        observed.push(handle);

        if (reason === "stop button") {
          await page.getByRole("button", { name: "Stop animation", exact: true }).click();
        } else {
          await page.emulateMedia({ reducedMotion: "reduce" });
        }
        await expect(typing).toHaveCount(0);
        const stoppedText = await handle.evaluate(({ state }) => state.node.textContent);
        await handle.evaluate(({ state, observer }) => {
          observer.takeRecords();
          state.mutations = 0;
        });

        // runFor executes recursive timers, unlike fastForward's single firing.
        // This covers all three names and their pauses without a real 8s wait.
        await page.clock.runFor(8000);
        for (const previous of observed) {
          expect(await previous.evaluate(({ state }) => ({
            connected: state.node.isConnected, mutations: state.mutations,
          }))).toEqual({ connected: false, mutations: 0 });
        }
        expect(await handle.evaluate(({ state }) => state.node.textContent)).toBe(stoppedText);

        if (cycle < 2) {
          if (reason === "stop button") {
            await page.getByRole("button", { name: "Restart animation", exact: true }).click();
          } else {
            await page.emulateMedia({ reducedMotion: "no-preference" });
          }
          await page.clock.runFor(500);
        }
      }
      expect(errors).toEqual([]);
    } finally {
      for (const handle of observed) {
        await handle.evaluate(({ observer }) => observer.disconnect());
        await handle.dispose();
      }
    }
  });
}
