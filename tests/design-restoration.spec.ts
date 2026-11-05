import { expect, test, type Page } from "@playwright/test";
import { themes } from "../data";

async function changedPixels(page: Page, first: Buffer, second: Buffer) {
  return page.evaluate(async ({ first, second }) => {
    const images = await Promise.all([first, second].map(async png => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      return image;
    }));
    if (images[0].width !== images[1].width || images[0].height !== images[1].height) throw new Error("Navbar dimensions changed");
    const canvas = document.createElement("canvas");
    canvas.width = images[0].width;
    canvas.height = images[0].height;
    const ctx = canvas.getContext("2d")!;
    const pixels = images.map(image => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    });
    let changed = 0;
    for (let i = 0; i < pixels[0].length; i += 4) {
      if ([0, 1, 2, 3].some(channel => pixels[0][i + channel] !== pixels[1][i + channel])) changed++;
    }
    return { changed, total: canvas.width * canvas.height };
  }, { first: first.toString("base64"), second: second.toString("base64") });
}

test("theme menu plays the original 200ms opening transition and closed choices stay inert", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/send", route => route.abort());
  await page.goto("/", { waitUntil: "networkidle" });
  const panel = page.locator("#theme-options");
  const trace = await panel.evaluateHandle(element => {
    const events: { type: string; property: string; elapsed: number }[] = [];
    const record = (event: Event) => {
      if (event.target === element && event instanceof TransitionEvent) {
        events.push({ type: event.type, property: event.propertyName, elapsed: event.elapsedTime });
      }
    };
    element.addEventListener("transitionrun", record);
    element.addEventListener("transitionend", record);
    return { events, cleanup: () => {
      element.removeEventListener("transitionrun", record);
      element.removeEventListener("transitionend", record);
    } };
  });
  try {
    const trigger = page.getByRole("button", { name: "Choose theme" });
    await trigger.click();
    await expect.poll(() => trace.evaluate(({ events }) =>
      ["opacity", "transform"].every(property => events.some(e => e.type === "transitionend" && e.property === property))
    ), { timeout: 3000 }).toBe(true);
    const events = await trace.evaluate(({ events }) => events);
    for (const property of ["opacity", "transform"]) {
      expect(events.some(e => e.type === "transitionrun" && e.property === property)).toBe(true);
      expect(events.find(e => e.type === "transitionend" && e.property === property)!.elapsed).toBeCloseTo(0.2, 3);
    }
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveAttribute("aria-hidden", "true");
    await expect(panel).toHaveCSS("visibility", "hidden");
    expect(await panel.evaluate(el => (el as HTMLElement).inert)).toBe(true);
    expect(await panel.locator("button").first().evaluate(el => { el.focus(); return document.activeElement === el; })).toBe(false);
    await page.keyboard.press("Tab");
    await expect(page.locator("nav .menu a").first()).toBeFocused();
  } finally {
    await trace.evaluate(({ cleanup }) => cleanup());
    await trace.dispose();
  }
});

for (const width of [320, 768, 1440]) {
  test(`original design at ${width}px: seven themes, original controls and real Navbar compositing`, async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(90_000); // Seven isolated themes, each with real image loads and three pixel captures.
    for (const theme of themes) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 },
        deviceScaleFactor: 1, locale: "en-US", timezoneId: "UTC", reducedMotion: "reduce" });
      try {
        await context.addInitScript(theme => localStorage.setItem("portfolio-theme", JSON.stringify({ state: { theme }, version: 0 })), theme.name);
        await context.route("**/api/send", route => route.abort());
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto("/", { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme.name);
        const originalColors = await page.evaluate(() => {
          const reference = document.createElement("span");
          reference.setAttribute("aria-hidden", "true");
          reference.style.cssText = "position:fixed;width:0;height:0;visibility:hidden";
          // Global reduced-motion durations must not interpolate the probe's
          // consecutive color assignments inside this synchronous measurement.
          reference.style.setProperty("transition", "none", "important");
          document.body.append(reference);
          const resolve = (property: string, value: string) => {
            reference.style.setProperty(property, value);
            return getComputedStyle(reference).getPropertyValue(property);
          };
          try {
            const expectedPrimary = resolve("color", "oklch(var(--p))");
            return {
              hero: getComputedStyle(document.querySelector(".hero-intro .readable-gradient")!).backgroundImage,
              expectedHero: resolve("background-image", "linear-gradient(to right, oklch(var(--p)), oklch(var(--s)), oklch(var(--a)))"),
              logo: getComputedStyle(document.querySelector(".logo-gradient")!).backgroundImage,
              expectedLogo: resolve("background-image", "linear-gradient(to right, oklch(var(--p)), oklch(var(--s)))"),
              cta: getComputedStyle(document.querySelector(".hire-link")!).backgroundImage,
              expectedCta: resolve("background-image", "linear-gradient(to bottom right, oklch(var(--p)), oklch(var(--s)), oklch(var(--a)))"),
              ctaInk: getComputedStyle(document.querySelector(".hire-link")!).color,
              expectedInk: resolve("color", "oklch(var(--bc))"),
              primary: getComputedStyle(document.querySelector("#about h2")!).color, expectedPrimary,
            };
          } finally { reference.remove(); }
        });
        expect(originalColors.hero).toBe(originalColors.expectedHero);
        expect(originalColors.logo).toBe(originalColors.expectedLogo);
        expect(originalColors.cta).toBe(originalColors.expectedCta);
        expect(originalColors.ctaInk).toBe(originalColors.expectedInk);
        expect(originalColors.primary).toBe(originalColors.expectedPrimary);
        await expect(page.locator("#email")).toHaveCSS("border-color", originalColors.expectedPrimary);
        expect(await page.locator("#email").evaluate(el => getComputedStyle(el, "::placeholder").color)).toBe("rgb(156, 163, 175)");
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        const circle = await page.locator("img[alt='Illustration of a person programming']").locator("..").boundingBox();
        expect(circle!.width).toBe(width >= 1024 ? 400 : 250);
        expect(circle!.height).toBe(circle!.width);
        const tabs = await page.getByRole("group", { name: "About categories" }).getByRole("button").all();
        const rows = new Set<number>();
        for (const tab of tabs) {
          const bounds = (await tab.boundingBox())!;
          rows.add(Math.round(bounds.y));
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        }
        if (width >= 768) expect(rows.size).toBe(1);
        else expect(rows.size).toBeGreaterThan(1);
        const trigger = page.getByRole("button", { name: "Choose theme" });
        await trigger.click();
        const panel = page.getByRole("group", { name: "Themes", exact: true });
        await expect(panel).toBeVisible();
        await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBe(224);
        await page.keyboard.press("Escape");
        await expect(trigger).toBeFocused();
        await expect(panel).toBeHidden();
        const photo = page.locator("#hobbies .carousel img").first();
        await photo.scrollIntoViewIfNeeded();
        await expect.poll(() => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
        await page.evaluate(() => {
          const img = document.querySelector("#hobbies .carousel img")!;
          scrollTo({ top: scrollY + img.getBoundingClientRect().top + 40, behavior: "instant" });
        });
        const nav = page.getByRole("navigation", { name: "Main navigation" });
        await expect(nav).toHaveCSS("backdrop-filter", "blur(16px)");
        expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toMatch(/\/ 0\.8\)$/);
        const glass = await nav.screenshot({ animations: "disabled" });
        const previousStyle = await nav.getAttribute("style");
        try {
          await nav.evaluate(el => { (el as HTMLElement).style.backdropFilter = "none"; });
          const clear = await nav.screenshot({ animations: "disabled" });
          const blurDifference = await changedPixels(page, glass, clear);
          expect(blurDifference.changed).toBeGreaterThan(blurDifference.total * 0.01);
          await nav.evaluate(el => { (el as HTMLElement).style.backgroundColor = "oklch(var(--b1))"; });
          const opaque = await nav.screenshot({ animations: "disabled" });
          const transparencyDifference = await changedPixels(page, glass, opaque);
          expect(transparencyDifference.changed).toBeGreaterThan(transparencyDifference.total * 0.05);
        } finally {
          await nav.evaluate((el, style) => {
            if (style === null) el.removeAttribute("style");
            else el.setAttribute("style", style);
          }, previousStyle);
        }
        await testInfo.attach(`${theme.name}-${width}-navbar-over-photo`, { body: glass, contentType: "image/png" });
        expect(errors).toEqual([]);
      } finally { await context.close(); }
    }
  });
}
