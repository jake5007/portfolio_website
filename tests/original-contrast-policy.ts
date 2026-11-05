import type { Page } from "@playwright/test";
import type { Result } from "axe-core";

// Owner-approved original-main exceptions, 2026-11-02.
// See docs/design-restoration.md (DR-C01..03). No rule is disabled.
export const originalContrastExceptions: Record<string, readonly string[]> = {
  night: ["cta", "hoverCta"],
  pastel: ["hero", "logo", "border", "placeholder"],
  autumn: ["cta", "hoverCta", "hero", "placeholder"],
  forest: ["cta", "hoverCta"],
  coffee: ["cta", "hoverCta", "hero", "logo"],
  luxury: ["cta", "hoverCta", "hero", "logo"],
  valentine: ["cta", "hoverCta", "hero", "logo", "border", "placeholder"],
};

export async function partitionOriginalContrast(page: Page, theme: string, violations: Result[]) {
  const known: Result[] = [];
  const unexpected: Result[] = [];
  for (const violation of violations) {
    if (violation.id !== "color-contrast") {
      unexpected.push(violation);
      continue;
    }
    const accepted = await page.evaluate(({ theme, targets, foregrounds }) => {
      const root = getComputedStyle(document.documentElement);
      const ctx = document.createElement("canvas").getContext("2d")!;
      const rgba = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).join(",");
      };
      const token = (name: string) => rgba(`oklch(${root.getPropertyValue(name)})`);
      return targets.map((target, index) => {
        if (target.length !== 1 || typeof target[0] !== "string") return false;
        const element = document.querySelector(target[0]);
        if (!element) return false;
        const color = rgba(getComputedStyle(element).color);
        // DR-C01: exact original primary-colored headings/selected option.
        if (["pastel", "valentine"].includes(theme) && color === token("--p") && element.matches(
          "#about h2.text-primary, #work > h2.text-primary, #hobbies > h2.text-primary, " +
          "#theme-options button.text-primary[aria-pressed=true], #theme-options button.text-primary[aria-pressed=true] > span.text-sm"
        )) return true;
        // DR-C02: the original CTA foreground, only in failing themes.
        if (["night", "autumn", "forest", "coffee", "luxury", "valentine"].includes(theme) &&
          element.matches("a.hire-link[href='#contact']") && color === token("--bc")) return true;
        // DR-C03: empty fields' original gray placeholders, not entered text.
        return ["pastel", "autumn", "valentine"].includes(theme) &&
          element.matches("#contact input#email, #contact input#subject, #contact textarea#message") &&
          (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
          element.value === "" && element.placeholder.length > 0 &&
          color === token("--bc") && rgba(getComputedStyle(element).backgroundColor) === token("--b1") &&
          getComputedStyle(element, "::placeholder").color === "rgb(156, 163, 175)" &&
          foregrounds[index].length > 0 && foregrounds[index].every(value => rgba(value) === rgba("#9ca3af"));
      });
    }, { theme, targets: violation.nodes.map(node => node.target),
      foregrounds: violation.nodes.map(node => node.any.map(check => check.data?.fgColor).filter((value): value is string => typeof value === "string")) });
    const knownNodes = violation.nodes.filter((_, i) => accepted[i]);
    const unexpectedNodes = violation.nodes.filter((_, i) => !accepted[i]);
    if (knownNodes.length) known.push({ ...violation, nodes: knownNodes });
    if (unexpectedNodes.length) unexpected.push({ ...violation, nodes: unexpectedNodes });
  }
  return { known, unexpected };
}
