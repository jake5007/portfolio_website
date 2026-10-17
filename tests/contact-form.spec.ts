import { expect, test, type Page, type Route } from "@playwright/test";

const fields = {
  email: "visitor@example.com",
  subject: "Portfolio enquiry",
  message: "I would like to discuss a role.",
};

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // Failed HTTP/network cases intentionally produce browser resource errors.
    // JavaScript errors, hydration errors and unrelated asset failures still fail.
    if (message.location().url.endsWith("/api/send") &&
      message.text().startsWith("Failed to load resource:")) return;
    errors.push(message.text());
  });
  // A fallback safety net: no browser test may make a real mail request.
  await context.route("**/api/send", (route) => route.abort("blockedbyclient"));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#about")).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

async function fillForm(page: Page) {
  await page.getByLabel("Your Email").fill(fields.email);
  await page.getByLabel("Subject", { exact: true }).fill(fields.subject);
  await page.getByLabel("Message", { exact: true }).fill(fields.message);
}

async function expectPreserved(page: Page) {
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Your Email")).toHaveValue(fields.email);
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue(fields.subject);
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(fields.message);
}

test("confirmed success resets the form and displays the existing success toast", async ({ page }) => {
  let payload: unknown;
  await page.route("**/api/send", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Email sent successfully" }) });
  });
  await fillForm(page);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Email sent successfully :)", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your Email")).toHaveValue("");
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
  expect(payload).toEqual(fields);
});

for (const status of [400, 500, 502, 503]) {
  test(`HTTP ${status} restores loading state and preserves input`, async ({ page }) => {
    const message = status === 400 ? "Please check your message." : "The email service is temporarily unavailable.";
    await page.route("**/api/send", (route) => route.fulfill({ status,
      contentType: "application/json", body: JSON.stringify({ success: false, message }) }));
    await fillForm(page);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expectPreserved(page);
  });
}

test("network failure preserves input, recovers loading, and allows retry", async ({ page }) => {
  await page.route("**/api/send", (route) => route.abort("failed"));
  await fillForm(page);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Could not connect. Please check your connection and try again.", { exact: true })).toBeVisible();
  await expectPreserved(page);
  await page.route("**/api/send", (route) => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ success: true, message: "Email sent successfully" }) }));
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
});

for (const [name, contentType, body] of [
  ["malformed JSON", "application/json", "{broken"],
  ["non-JSON response", "text/html", "<html>Gateway error</html>"],
  ["missing confirmation", "application/json", JSON.stringify({ message: "Not confirmed" })],
]) {
  test(`${name} does not erase input or leave the button disabled`, async ({ page }) => {
    await page.route("**/api/send", (route) => route.fulfill({ status: 200, contentType, body }));
    await fillForm(page);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.getByText("We could not confirm your message was sent. Please try again.", { exact: true })).toBeVisible();
    await expectPreserved(page);
  });
}

test("a success flag on an HTTP error is not accepted as delivery confirmation", async ({ page }) => {
  await page.route("**/api/send", (route) => route.fulfill({ status: 500,
    contentType: "application/json", body: JSON.stringify({ success: true, message: "Incorrect confirmation" }) }));
  await fillForm(page);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Unable to send your message. Please try again later.", { exact: true })).toBeVisible();
  await expectPreserved(page);
});

test("duplicate submissions are blocked even before React rerenders", async ({ page }) => {
  let calls = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/send", async (route) => {
    calls++;
    await gate;
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Email sent successfully" }) });
  });
  try {
    await fillForm(page);
    await page.locator("#contact form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await expect(page.getByRole("button", { name: "Sending...", exact: true })).toBeDisabled();
    await expect.poll(() => calls).toBe(1);
  } finally {
    release();
  }
  await expect(page.getByLabel("Your Email")).toHaveValue("");
  expect(calls).toBe(1);
});

test("a stalled request times out, preserves input, and restores the button", async ({ page }) => {
  await page.clock.install();
  let pending: Route | undefined;
  await page.route("**/api/send", (route) => { pending = route; });
  try {
    await fillForm(page);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => !!pending).toBe(true);
    await page.clock.fastForward(35_001);
    await expect(page.getByText("The request timed out. Please try again.", { exact: true })).toBeVisible();
    await expectPreserved(page);
  } finally {
    await pending?.abort().catch(() => {});
  }
});

test("all fields are required and enforce the documented length limits", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/send", (route) => { calls++; return route.abort(); });
  await expect(page.getByLabel("Your Email")).toHaveAttribute("maxlength", "254");
  await expect(page.getByLabel("Subject", { exact: true })).toHaveAttribute("maxlength", "150");
  await expect(page.getByLabel("Message", { exact: true })).toHaveAttribute("maxlength", "5000");
  await page.getByLabel("Your Email").fill(fields.email);
  await page.getByLabel("Subject", { exact: true }).fill(fields.subject);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  expect(await page.getByLabel("Message", { exact: true }).evaluate((node: HTMLTextAreaElement) => node.validity.valueMissing)).toBe(true);
  expect(calls).toBe(0);
});

for (const [name, width, height, contactWidth] of [
  ["desktop", 1440, 900, 1200], ["mobile", 390, 844, 310],
] as const) {
  test.describe(`${name} layout`, () => {
    test.use({ viewport: { width, height }, reducedMotion: "reduce" });
    test("preserves Contact appearance", async ({ page }, testInfo) => {
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      const bounds = await page.locator("#contact").boundingBox();
      expect(bounds?.width).toBe(contactWidth);
      expect(bounds?.height).toBe(486);
      expect(await page.evaluate(() => document.body.scrollWidth)).toBe(width);
      const shot = testInfo.outputPath(`contact-${name}.png`);
      await page.locator("#contact").screenshot({ path: shot, animations: "disabled" });
      await testInfo.attach(`contact-${name}`, { path: shot, contentType: "image/png" });
    });
  });
}

test("production homepage and invalid API request remain healthy", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain("I'm a QA Engineer");
  // No valid payload is ever sent to the production SMTP route.
  const invalid = await request.post("/api/send", { data: {} });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ success: false, message: "Please complete all fields with valid text." });
  const malformed = await request.post("/api/send", {
    headers: { "Content-Type": "application/json" }, data: "{broken",
  });
  expect(malformed.status()).toBe(400);
  const oversized = await request.post("/api/send", { data: { padding: "x".repeat(32768) } });
  expect(oversized.status()).toBe(413);
  expect(await oversized.json()).toEqual({ success: false, message: "The request is too large." });
  const sameOrigin = await request.post("/api/send", {
    headers: { Origin: "http://127.0.0.1:3105" }, data: {},
  });
  expect(sameOrigin.status()).toBe(400);
  const crossOrigin = await request.post("/api/send", {
    headers: { Origin: "https://untrusted.example" }, data: {},
  });
  expect(crossOrigin.status()).toBe(403);
});
