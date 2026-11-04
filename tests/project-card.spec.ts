import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

async function loadCards(page: Page) {
  await page.addInitScript(() => localStorage.setItem("portfolio-theme", JSON.stringify({ state: { theme: "night" }, version: 0 })));
  await page.context().route("**/api/send", route => route.abort());
  // Popup navigation's first request belongs to the context, not the opener.
  await page.context().route("https://**/*", route => route.fulfill({ contentType: "text/html", body: "<title>Local project target</title>" }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const figure = page.locator("#work figure").first();
  await figure.scrollIntoViewIfNeeded();
  await expect.poll(() => figure.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  return figure;
}

test.describe("project card touch gestures", () => {
  test.use({ viewport: { width: 320, height: 900 }, isMobile: true, hasTouch: true });

  test("a completed image tap stays revealed without hover and closes on an outside tap", async ({ page }) => {
    const figure = await loadCards(page);
    const overlay = figure.locator(".project-actions");
    await expect(overlay).toHaveCSS("opacity", "0");
    await figure.tap({ position: { x: 5, y: 5 } });
    // A hybrid pointer can leave the image after touch. CSS :hover is not
    // persistent touch state; assert both its absence and the visible actions.
    await figure.hover();
    await page.mouse.move(0, 0);
    await expect.poll(() => figure.evaluate(el => el.matches(":hover"))).toBe(false);
    await expect(overlay).toHaveCSS("opacity", "1");
    await expect(overlay).toHaveCSS("pointer-events", "auto");
    await page.getByRole("heading", { name: "My Work", exact: true }).tap();
    await expect(overlay).toHaveCSS("opacity", "0");
    await expect(overlay).toHaveCSS("pointer-events", "none");
  });

  for (const actionIndex of [0, 1]) {
    test(`first tap over hidden action ${actionIndex + 1} only reveals; the next tap activates its native link safely`, async ({ page, context }) => {
      const figure = await loadCards(page);
      const overlay = figure.locator(".project-actions");
      const link = figure.getByRole("link").nth(actionIndex);
      await expect(overlay).toHaveCSS("opacity", "0");
      const bounds = (await link.boundingBox())!;
      const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, point)).toBe("IMG");
      const clicks = await figure.evaluateHandle(element => {
        const targets: (string | null)[] = [];
        const record = (event: MouseEvent) => {
          if (event.target instanceof Element && element.contains(event.target)) targets.push(event.target.closest("a")?.getAttribute("href") ?? null);
        };
        document.addEventListener("click", record, true);
        return { targets, cleanup: () => document.removeEventListener("click", record, true) };
      });
      try {
        await page.touchscreen.tap(point.x, point.y);
        await expect.poll(() => clicks.evaluate(value => value.targets.length)).toBe(1);
        await page.mouse.move(0, 0);
        await expect(overlay).toHaveCSS("opacity", "1");
        expect(context.pages()).toHaveLength(1);
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        const popupPromise = page.waitForEvent("popup");
        await link.tap();
        const popup = await popupPromise;
        await popup.waitForLoadState("domcontentloaded");
        expect(popup.url()).toBe(await link.getAttribute("href"));
        expect(await popup.evaluate(() => window.opener)).toBeNull();
        await popup.close();
      } finally {
        await clicks.evaluate(value => value.cleanup());
        await clicks.dispose();
      }
    });
  }

  test("touch activation does not pin the old overlay after returning and hovering another card", async ({ page }) => {
    const figure = await loadCards(page);
    const second = page.locator("#work figure").nth(1);
    const link = figure.getByRole("link").first();
    await figure.tap({ position: { x: 5, y: 5 } });
    await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "1");
    const pending = page.waitForEvent("popup");
    await link.tap();
    const popup = await pending;
    try {
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url()).toBe(await link.getAttribute("href"));
      expect(await popup.evaluate(() => window.opener)).toBeNull();
      await popup.bringToFront();
      await page.bringToFront();
      await second.hover();
      await expect(second.locator(".project-actions")).toHaveCSS("opacity", "1");
      await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "0");
      // A fresh first tap must still reopen the card after native navigation.
      await figure.tap({ position: { x: 5, y: 5 } });
      await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "1");
    } finally {
      await popup.close();
    }
  });
});

test("mouse hover remains transient and native keyboard focus reveals and activates project links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const figure = await loadCards(page);
  const overlay = figure.locator(".project-actions");
  await expect(overlay).toHaveCSS("opacity", "0");
  await figure.hover();
  await expect(overlay).toHaveCSS("opacity", "1");
  await page.mouse.move(0, 0);
  await expect(overlay).toHaveCSS("opacity", "0");
  const links = figure.getByRole("link");
  await page.getByRole("button", { name: "Test", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  await expect(overlay).toHaveCSS("opacity", "1");
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  expect(await links.nth(1).evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
  const popupPromise = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toBe(await links.nth(1).getAttribute("href"));
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
  await page.getByRole("button", { name: "Test", exact: true }).focus();
  await expect(overlay).toHaveCSS("opacity", "0");
});

for (const actionIndex of [0, 1]) {
  test(`mouse action ${actionIndex + 1} return keeps native focus without pinning an overlay`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const first = await loadCards(page);
    const second = page.locator("#work figure").nth(1);
    const link = first.getByRole("link").nth(actionIndex);
    await first.hover();
    await expect(first.locator(".project-actions")).toHaveCSS("opacity", "1");
    const pending = page.waitForEvent("popup");
    await link.click();
    const popup = await pending;
    try {
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url()).toBe(await link.getAttribute("href"));
      expect(await popup.evaluate(() => window.opener)).toBeNull();
      await popup.bringToFront();
      await page.bringToFront();
      await second.hover();
      await expect(second.locator(".project-actions")).toHaveCSS("opacity", "1");
      await expect(first.locator(".project-actions")).toHaveCSS("opacity", "0");
      await expect(link).toBeFocused();
      expect(await link.evaluate(el => el.matches(":focus-visible"))).toBe(false);
      expect(await page.locator("#work .project-actions").evaluateAll(elements =>
        elements.filter(el => parseFloat(getComputedStyle(el).opacity) > 0).length)).toBe(1);
      await page.mouse.move(0, 0);
      await expect(second.locator(".project-actions")).toHaveCSS("opacity", "0");
      // Preserve the browser's Tab position rather than blurring the old link.
      await page.keyboard.press("Tab");
      const next = page.locator("#work figure a").nth(actionIndex + 1);
      await expect(next).toBeFocused();
      await expect(next.locator("..")).toHaveCSS("opacity", "1");
      expect(await next.evaluate(el => el.matches(":focus-visible"))).toBe(true);
    } finally {
      await popup.close();
    }
  });
}

test("keyboard activation preserves visible actions and Tab order after returning from an external tab", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const figure = await loadCards(page);
  const links = figure.getByRole("link");
  await page.getByRole("button", { name: "Test", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  const pending = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const popup = await pending;
  try {
    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toBe(await links.first().getAttribute("href"));
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.bringToFront();
    await page.bringToFront();
    await expect(links.first()).toBeFocused();
    expect(await links.first().evaluate(el => el.matches(":focus-visible"))).toBe(true);
    await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "1");
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "1");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Test", exact: true })).toBeFocused();
    await expect(figure.locator(".project-actions")).toHaveCSS("opacity", "0");
  } finally {
    await popup.close();
  }
});
