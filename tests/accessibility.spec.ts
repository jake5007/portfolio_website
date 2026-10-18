import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { version as playwrightVersion } from "@playwright/test/package.json";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { themes } from "../data";
import { observeNavigationFocus, attachNavigationFocus, navigationFocusStep } from "./navigation-focus-diagnostics";

test.use({ reducedMotion: "reduce" });
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await context.route("**/api/send", (route) => route.abort("blockedbyclient"));
  // Project activation is tested without visiting external services.
  await context.route("https://**/*", (route) => route.fulfill({
    status: 200, contentType: "text/html", body: "<title>Local navigation fixture</title>",
  }));
});
test.afterEach(async ({ page }, testInfo) => {
  await attachNavigationFocus(page, testInfo);
  if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
    await testInfo.attach("navigation-focus-state", {
      contentType: "application/json",
      body: JSON.stringify(await page.evaluate(() => ({
        documentFocused: document.hasFocus(),
        activeTag: document.activeElement?.tagName,
        activeName: document.activeElement?.getAttribute("aria-label"),
        activeHref: document.activeElement?.getAttribute("href"),
        activeId: document.activeElement?.id,
        desktop: matchMedia("(min-width: 768px)").matches,
        viewport: { width: innerWidth, height: innerHeight },
      })), null, 2),
    });
  }
  expect(browserErrors.get(page)).toEqual([]);
});

async function load(page: Page, theme = "night") {
  await page.addInitScript((theme) => {
    if (!localStorage.getItem("portfolio-theme")) {
      localStorage.setItem("portfolio-theme", JSON.stringify({ state: { theme }, version: 0 }));
    }
  }, theme);
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(() => document.fonts.ready);
}

async function focusVisible(page: Page) {
  const indicator = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement!);
    return { width: parseFloat(style.outlineWidth), color: style.outlineColor, style: style.outlineStyle };
  });
  expect(indicator.width).toBeGreaterThanOrEqual(2);
  expect(indicator.style).toBe("solid");
  expect(indicator.color).not.toMatch(/transparent|rgba\([^)]*, 0\)/);
}

test("skip link, landmarks, headings and native link activation", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "About Me", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sauce Demo Playwright E2E Test", level: 3 })).toHaveCount(1);
  await expect(page.locator("a button, button a")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await focusVisible(page);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Hire Me" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contact")).toBeFocused();
  await expect(page.getByRole("link", { name: "GitHub profile (opens in a new tab)", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn profile (opens in a new tab)", exact: true })).toBeVisible();
});

test("mobile disclosure supports Space, Escape, destination focus and desktop resize", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await load(page);
  await observeNavigationFocus(page);
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Close navigation" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#mobile-navigation a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator("#mobile-navigation").getByRole("link", { name: "Work" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#work")).toBeFocused();
  await expect(page).toHaveURL(/#work$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(await page.locator("#work").evaluate((n) => n.getBoundingClientRect().top)).toBeGreaterThanOrEqual(55);
  await navigationFocusStep(page, "reopen mobile menu", () => toggle.click());
  await navigationFocusStep(page, "assert reopened mobile link focused", () => expect(page.locator("#mobile-navigation a").first()).toBeFocused());
  await navigationFocusStep(page, "resize to desktop", () => page.setViewportSize({ width: 1024, height: 900 }));
  await navigationFocusStep(page, "assert mobile menu removed", () => expect(page.locator("#mobile-navigation")).toHaveCount(0));
  await navigationFocusStep(page, "assert desktop link focused", () => expect(page.locator("nav .menu a").first()).toBeFocused());
  await navigationFocusStep(page, "resize to mobile", () => page.setViewportSize({ width: 320, height: 900 }));
  await navigationFocusStep(page, "assert mobile toggle focused", () => expect(toggle).toBeFocused());
});

test("mobile navigation has a natural Tab exit without a focus trap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  await expect(page.locator("#mobile-navigation a").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Hire Me" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#mobile-navigation a").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
});

test("navigation preserves focus across repeated breakpoint changes without stealing content focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await load(page);
  await observeNavigationFocus(page);
  const toggle = page.getByRole("button", { name: "Open navigation" });
  const desktopLink = page.locator("nav .menu a").first();
  // Exercise both ordinary widths and the exact CSS breakpoint in one document.
  // CSS blur and matchMedia notifications can arrive in either order.
  for (let i = 0; i < 40; i++) {
    await test.step(`breakpoint round trip ${i + 1}`, async () => {
      await toggle.click();
      await expect(page.locator("#mobile-navigation a").first()).toBeFocused();
      await page.setViewportSize({ width: i % 2 ? 768 : 1024, height: 900 });
      await expect(page.locator("#mobile-navigation")).toHaveCount(0);
      await expect(desktopLink).toBeFocused();
      await page.setViewportSize({ width: i % 2 ? 767 : 320, height: 900 });
      await expect(toggle).toBeFocused();
    });
  }
  // The closed-menu toggle also disappears when crossing to desktop.
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(desktopLink).toBeFocused();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect(toggle).toBeFocused();
  // Resizing must leave focus alone when no navigation control is disappearing.
  const email = page.getByRole("textbox", { name: "Your Email" });
  await email.focus();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(email).toBeFocused();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect(email).toBeFocused();
});

test("all themes support keyboard selection, Escape, outside dismissal and persistence", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await load(page);
  const trigger = page.getByRole("button", { name: "Choose theme" });
  await trigger.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Pastel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  for (const theme of themes) {
    await trigger.press("Enter");
    const choice = page.getByRole("button", { name: theme.label, exact: true });
    // Native Tab order reaches each option without custom menu key bindings.
    for (let i = 0; i <= themes.indexOf(theme); i++) await page.keyboard.press("Tab");
    await expect(choice).toBeFocused();
    await choice.press("Space");
    await expect(trigger).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.name);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("portfolio-theme")!).state.theme)).toBe(theme.name);
  }
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "valentine");
  await trigger.click();
  await expect(page.getByRole("button", { name: "Valentine", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Jin home" }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("project links reveal on keyboard focus and activate safely", async ({ page }) => {
  await load(page);
  await page.getByRole("button", { name: "Test", exact: true }).focus();
  const links = page.locator("#work figure a");
  await expect(links).toHaveCount(22);
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press("Tab");
    await expect(links.nth(i)).toBeFocused();
    await expect(links.nth(i).locator("..")).toHaveCSS("opacity", "1");
    await expect(links.nth(i)).toHaveAccessibleName(/: (live site|source code) \(opens in a new tab\)$/);
    await focusVisible(page);
  }
  const first = links.first();
  await first.focus();
  const popupPromise = page.waitForEvent("popup");
  await first.press("Enter");
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toBe(await first.getAttribute("href"));
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
});

test.describe("touch navigation", () => {
  test.use({ viewport: { width: 320, height: 900 }, isMobile: true, hasTouch: true });
  test("project actions are present without hover and have adequate target sizes", async ({ page }) => {
    await load(page);
    const action = page.locator("#work figure a").first();
    await action.scrollIntoViewIfNeeded();
    await expect(action.locator("..")).toHaveCSS("opacity", "1");
    const bounds = await action.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    const popupPromise = page.waitForEvent("popup");
    await action.tap();
    const popup = await popupPromise;
    await popup.close();
    await page.getByRole("button", { name: "Open navigation" }).tap();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await page.getByRole("button", { name: "Close navigation" }).tap();
    await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  });
});

test("category buttons expose selection and retain native keyboard activation", async ({ page }) => {
  await load(page);
  const categories = page.getByRole("group", { name: "About categories" });
  const education = categories.getByRole("button", { name: "Education", exact: true });
  await education.focus();
  await education.press("Space");
  await expect(education).toHaveAttribute("aria-pressed", "true");
  await expect(categories.getByRole("button", { name: "Skills", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Handong Global University (Pohang, South Korea)", { exact: false })).toBeVisible();
  const projects = page.getByRole("group", { name: "Project categories" });
  await projects.getByRole("button", { name: "Test", exact: true }).press("Enter");
  await expect(page.locator("#work .card")).toHaveCount(1);
});

test("photo regions scroll with native keys and allow Tab to leave", async ({ page }) => {
  await load(page);
  const gallery = page.getByRole("region", { name: "language exchange photos" });
  await gallery.scrollIntoViewIfNeeded();
  // Lazy images determine slide width. Wait for real scrollable content before
  // sending a key; otherwise a key can precede image decoding and do nothing.
  await expect.poll(() => gallery.locator("img").first().evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
  await expect.poll(() => gallery.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true);
  await gallery.focus();
  await focusVisible(page);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => gallery.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("region", { name: "travel & pictures photos" })).toBeFocused();
});

test("form labels, autocomplete, native validation and focus are accessible", async ({ page }) => {
  await load(page);
  await expect(page.getByRole("form", { name: "Contact", exact: true })).toBeVisible();
  for (const name of ["Your Email", "Subject", "Message"]) {
    const input = page.getByRole("textbox", { name, exact: true });
    await expect(input).toHaveAttribute("required", "");
    await input.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(input).toBeFocused();
    await focusVisible(page);
  }
  await expect(page.getByLabel("Your Email")).toHaveAttribute("autocomplete", "email");
  await page.getByLabel("Your Email").fill("invalid-email");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByLabel("Your Email")).toBeFocused();
  expect(await page.getByLabel("Your Email").evaluate((n: HTMLInputElement) => n.validity.typeMismatch)).toBe(true);
});

test("reduced motion is static before scrolling and back-to-top restores focus", async ({ page }) => {
  await load(page);
  await expect(page.locator(".motion-typing")).toHaveCount(0);
  await expect(page.locator(".reduced-motion-name")).toBeVisible();
  await expect(page.locator(".hero-intro")).toHaveCSS("opacity", "1");
  for (const element of await page.locator("[data-entrance]").all()) {
    await expect(element).toHaveCSS("transform", "none");
    await expect(element).toHaveCSS("opacity", "1");
  }
  await page.clock.install();
  await page.clock.fastForward(10_000);
  await expect(page.locator(".reduced-motion-name")).toHaveText("현진");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const top = page.getByRole("button", { name: "Back to top" });
  await expect(top).toBeVisible();
  await top.click();
  await expect(page.getByRole("main")).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("normal motion remains available without hydration or console errors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await load(page);
  await expect(page.locator(".motion-typing")).toBeVisible();
  const scan = await new AxeBuilder({ page }).include(".motion-control").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await expect(page.locator(".reduced-motion-name")).toBeHidden();
  const transition = await page.locator("[data-entrance]").first().evaluate((n) => getComputedStyle(n).transitionDuration);
  expect(parseFloat(transition)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Stop animation", exact: true }).click();
  await expect(page.locator(".motion-typing")).toHaveCount(0);
  await expect(page.locator(".static-name")).toHaveText("현진");
  const restart = page.getByRole("button", { name: "Restart animation", exact: true });
  await expect(restart).toBeFocused();
  await restart.press("Space");
  await expect(page.locator(".motion-typing")).toBeVisible();
});

for (const width of [320, 360, 390, 768, 1440]) {
  test(`no document overflow or clipped theme choices at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await load(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.getByRole("button", { name: "Choose theme" }).click();
    const bounds = await page.getByRole("group", { name: "Themes", exact: true }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    for (const button of await page.getByRole("group", { name: "Themes", exact: true }).getByRole("button").all()) {
      const target = await button.boundingBox();
      expect(target!.height).toBeGreaterThanOrEqual(24);
    }
  });
}

// Record actual glyph fonts and webfont bytes, not just the CSS font-family:
// fallback fonts can differ even when the same family is requested.
async function attachVisualEnvironment(page: Page, testInfo: TestInfo) {
  const rendered = await page.evaluate(() => ({
    deviceScaleFactor: devicePixelRatio,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: document.documentElement.dataset.theme,
    fontsStatus: document.fonts.status,
    fonts: Array.from(document.fonts).map(font => ({
      family: font.family, weight: font.weight, style: font.style, status: font.status,
    })),
    fontAssets: performance.getEntriesByType("resource").map(entry => new URL(entry.name).pathname)
      .filter(path => /^\/_next\/static\/media\/[^/]+\.woff2$/.test(path)),
    fontFamilies: Object.fromEntries(["#contact label", "#contact input", "#contact textarea", "#contact button"]
      .map(selector => [selector, getComputedStyle(document.querySelector(selector)!).fontFamily])),
  }));
  const session = await page.context().newCDPSession(page);
  const platformFonts: Record<string, unknown> = {};
  try {
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const { root } = await session.send("DOM.getDocument");
    for (const selector of ["#contact label", "#contact button"]) {
      const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector });
      platformFonts[selector] = (await session.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
    }
  } finally {
    await session.detach();
  }
  await testInfo.attach("visual-environment", {
    contentType: "application/json",
    body: JSON.stringify({
      os: process.platform === "linux" ? readFileSync("/etc/os-release", "utf8") : process.platform,
      architecture: process.arch, nodeVersion: process.version, playwrightVersion,
      browserVersion: page.context().browser()?.version(), viewport: page.viewportSize(),
      ...rendered, platformFonts,
      fontAssets: Array.from(new Set(rendered.fontAssets)).map(path => ({
        path,
        sha256: createHash("sha256").update(readFileSync(join(".next", "static", "media", basename(path)))).digest("hex"),
      })),
    }, null, 2),
  });
}

for (const width of [1440, 320]) {
  for (const theme of themes) {
    test(`${theme.name} ${width}px: WCAG-tagged axe checks, including open theme controls`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await load(page, theme.name);
      await page.locator("#hobbies").scrollIntoViewIfNeeded();
      const scan = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
      const closed = await scan().analyze();
      expect(closed.violations).toEqual([]);
      await page.getByRole("button", { name: "Choose theme" }).click();
      const open = await scan().include("nav").analyze();
      await testInfo.attach("axe-review-needed", {
        body: JSON.stringify({ closed: closed.incomplete, open: open.incomplete }, null, 2),
        contentType: "application/json",
      });
      expect(open.violations).toEqual([]);
    });
  }

  test(`${width}px Contact visual regression`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await load(page);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await attachVisualEnvironment(page, testInfo);
    await expect(page.locator("#contact")).toHaveScreenshot(`contact-night-${width}.png`, {
      animations: "disabled", maxDiffPixels: 0,
    });
  });
}

// axe marks gradient text as "needs review". Sample a text-free browser-rendered
// copy of each actual gradient, rather than assuming the endpoints are sufficient.
async function gradientContrast(page: Page, selector: string, reference: "text" | "background") {
  const color = await page.evaluate(({ selector, reference }) => {
    const element = document.querySelector(selector)!;
    const style = getComputedStyle(element);
    const probe = document.createElement("div");
    probe.id = "contrast-probe";
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      position: "fixed", top: "100px", left: "0", width: "400px", height: "40px",
      zIndex: "9999", backgroundImage: style.backgroundImage,
    });
    document.body.append(probe);
    return reference === "text" ? style.color : getComputedStyle(document.documentElement).backgroundColor;
  }, { selector, reference });
  try {
    const pixels = await page.locator("#contrast-probe").screenshot({ animations: "disabled" });
    return await page.evaluate(async ({ png, color }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const referencePixel = ctx.getImageData(0, 0, 1, 1).data;
      if (referencePixel[3] !== 255) throw new Error("Expected an opaque contrast reference");
      const reference = Array.from(referencePixel).slice(0, 3);
      const luminance = (rgb: number[]) => rgb.map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const ref = luminance(reference);
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      let minimum = Infinity;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 255) throw new Error("Expected an opaque gradient sample");
        const sample = luminance([data[i], data[i + 1], data[i + 2]]);
        minimum = Math.min(minimum, (Math.max(ref, sample) + 0.05) / (Math.min(ref, sample) + 0.05));
      }
      return minimum;
    }, { png: pixels.toString("base64"), color });
  } finally {
    await page.locator("#contrast-probe").evaluate((n) => n.remove());
  }
}

for (const theme of themes) {
  test(`${theme.name}: rendered gradient contrast meets text thresholds`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await load(page, theme.name);
    const cta = await gradientContrast(page, ".hire-link", "text");
    const hero = await gradientContrast(page, ".hero-intro .readable-gradient", "background");
    const logo = await gradientContrast(page, ".logo-gradient", "background");
    await page.locator(".hire-link").hover();
    await expect(page.locator(".hire-link")).toHaveCSS("opacity", "1");
    const hoverCta = await gradientContrast(page, ".hire-link", "text");
    await page.getByLabel("Your Email").focus();
    const controls = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const rgb = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        if (pixel[3] !== 255) throw new Error("Control contrast needs opaque colors");
        return Array.from(pixel).slice(0, 3);
      };
      const luminance = (rgb: number[]) => rgb.map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = luminance(rgb(getComputedStyle(document.documentElement).backgroundColor));
      const ratio = (color: string) => {
        const fg = luminance(rgb(color));
        return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
      };
      const input = document.querySelector("input")!;
      const focus = ratio(getComputedStyle(input).outlineColor);
      rgb(getComputedStyle(document.querySelector("nav")!).backgroundColor);
      return {
        focus, border: ratio(getComputedStyle(input).borderColor),
        placeholder: ratio(getComputedStyle(input, "::placeholder").color),
      };
    });
    await testInfo.attach("gradient-contrast", {
      body: JSON.stringify({ theme: theme.name, cta, hoverCta, hero, logo, ...controls }), contentType: "application/json",
    });
    expect(cta).toBeGreaterThanOrEqual(4.5);
    expect(hero).toBeGreaterThanOrEqual(3);
    expect(logo).toBeGreaterThanOrEqual(3);
    expect(hoverCta).toBeGreaterThanOrEqual(4.5);
    expect(controls.focus).toBeGreaterThanOrEqual(3);
    expect(controls.border).toBeGreaterThanOrEqual(3);
    expect(controls.placeholder).toBeGreaterThanOrEqual(4.5);
  });
}
