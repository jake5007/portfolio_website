import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { partitionOriginalContrast } from "./original-contrast-policy";

test("original contrast exceptions preserve new contrast failures, other rules and theme boundaries", async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en" data-theme="pastel"
    style="--p:83.0828% 0.034896 316.874;--bc:20% 0 0;--b1:100% 0 0"><head><title>Policy fixture</title></head>
    <body style="background:white"><main><h1>Fixture</h1>
      <section id="about"><h2 id="original-heading" class="text-primary" style="color:oklch(var(--p))">Original heading</h2></section>
      <p id="new-contrast" style="color:#eee">Unapproved low contrast text</p>
      <button id="unnamed" style="width:44px;height:44px"></button>
    </main></body></html>`);
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const review = await partitionOriginalContrast(page, "pastel", scan.violations);
  expect(review.known.flatMap(rule => rule.nodes.flatMap(node => node.target))).toContain("#original-heading");
  expect(review.unexpected.find(rule => rule.id === "color-contrast")?.nodes.flatMap(node => node.target)).toContain("#new-contrast");
  expect(review.unexpected.some(rule => rule.id === "button-name")).toBe(true);
  await page.locator("html").evaluate(el => el.setAttribute("data-theme", "night"));
  const otherTheme = await partitionOriginalContrast(page, "night", scan.violations);
  expect(otherTheme.known).toEqual([]);
  expect(otherTheme.unexpected.find(rule => rule.id === "color-contrast")?.nodes.flatMap(node => node.target)).toContain("#original-heading");
});
