import type { Page, TestInfo } from "@playwright/test";

const phases = new WeakMap<Page, Array<{ time: number; label: string; phase: string }>>();
const observedPages = new WeakSet<Page>();

/** Node-side timestamps avoid extra browser round trips around the resize race. */
export async function navigationFocusStep(page: Page, label: string, action: () => Promise<unknown>) {
  const events = phases.get(page) ?? [];
  phases.set(page, events);
  events.push({ time: Date.now(), label, phase: "begin" });
  try {
    await action();
    events.push({ time: Date.now(), label, phase: "passed" });
  } catch (error) {
    events.push({ time: Date.now(), label, phase: "failed" });
    throw error;
  }
}

/** Scoped to the resize test: bounded in-memory events, no console or polling. */
export async function observeNavigationFocus(page: Page) {
  await page.evaluate(() => {
    const desktop = matchMedia("(min-width: 768px)");
    const identities = new WeakMap<Element, number>();
    let nextId = 0;
    const identify = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      if (!identities.has(target)) identities.set(target, ++nextId);
      return {
        identity: identities.get(target), tag: target.tagName, id: target.id,
        href: target.getAttribute("href"), label: target.getAttribute("aria-label"),
        region: target.closest("#mobile-navigation") ? "mobile-links"
          : target.closest("nav .menu") ? "desktop-links"
          : target.matches("[aria-controls=mobile-navigation]") ? "toggle" : "other",
        connected: target.isConnected,
      };
    };
    const events: unknown[] = [];
    const record = (kind: string, event?: Event) => {
      if (events.length >= 500) events.shift();
      events.push({
        time: performance.now(), kind, target: identify(event?.target ?? null),
        related: identify(event instanceof FocusEvent ? event.relatedTarget : null),
        active: identify(document.activeElement), documentFocused: document.hasFocus(),
        desktop: desktop.matches, width: innerWidth,
        menuMounted: !!document.getElementById("mobile-navigation"),
        expanded: document.querySelector("[aria-controls=mobile-navigation]")?.getAttribute("aria-expanded"),
      });
    };
    const listeners: Array<[EventTarget, string, EventListener]> = [];
    for (const type of ["focus", "blur", "focusin", "focusout"]) {
      const listener = (event: Event) => record(type, event);
      document.addEventListener(type, listener, true);
      listeners.push([document, type, listener]);
    }
    for (const type of ["resize", "focus", "blur"]) {
      const listener = (event: Event) => {
        if (event.target === window) record(`window:${type}`, event);
      };
      window.addEventListener(type, listener, true);
      listeners.push([window, type, listener]);
    }
    const mediaChange = () => record("breakpoint:change");
    desktop.addEventListener("change", mediaChange);
    const mutations = new MutationObserver((records) => {
      for (const mutation of records) {
        if (mutation.type === "attributes") record("menu:expanded");
        for (const node of [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)]) {
          if (node instanceof Element && (node.id === "mobile-navigation" || node.querySelector("#mobile-navigation"))) {
            record(node.isConnected ? "menu:mounted" : "menu:unmounted");
          }
        }
      }
    });
    const nav = document.querySelector("nav")!;
    mutations.observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-expanded"] });
    record("observation:start");
    const snapshot = () => ({
      time: performance.now(), documentFocused: document.hasFocus(),
      active: identify(document.activeElement), desktop: desktop.matches,
      viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio },
      targets: ["[aria-controls=mobile-navigation]", "#mobile-navigation a", "nav .menu a"].map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, element: null };
        const style = getComputedStyle(element);
        return {
          selector, element: identify(element), display: style.display, visibility: style.visibility,
          rect: element.getBoundingClientRect().toJSON(), visible: element.checkVisibility(),
        };
      }),
    });
    const initial = snapshot();
    (window as typeof window & { navigationFocusDiagnostic?: unknown }).navigationFocusDiagnostic = {
      collect: () => ({ timeOrigin: performance.timeOrigin, initial, final: snapshot(), events }),
      dispose: () => {
        for (const [target, type, listener] of listeners) target.removeEventListener(type, listener, true);
        desktop.removeEventListener("change", mediaChange);
        mutations.disconnect();
      },
    };
  });
  observedPages.add(page);
}

export async function attachNavigationFocus(page: Page, testInfo: TestInfo) {
  if (!observedPages.has(page)) return;
  observedPages.delete(page);
  if (page.isClosed()) {
    phases.delete(page);
    return;
  }
  const data = await page.evaluate(() => {
    const host = window as typeof window & {
      navigationFocusDiagnostic?: { collect: () => unknown; dispose: () => void };
    };
    const diagnostic = host.navigationFocusDiagnostic;
    if (!diagnostic) return null;
    try { return diagnostic.collect(); }
    finally { diagnostic.dispose(); delete host.navigationFocusDiagnostic; }
  });
  if (data) await testInfo.attach("navigation-focus-chronology", {
    contentType: "application/json", body: JSON.stringify({ ...data, assertions: phases.get(page) ?? [] }, null, 2),
  });
  phases.delete(page);
}
