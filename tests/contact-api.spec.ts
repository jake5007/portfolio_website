import { expect, test } from "@playwright/test";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { createContactHandler } from "../lib/contact-handler";
import { createContactMailer } from "../lib/contact-mail";
import { POST } from "../app/api/send/route";

const valid = {
  email: "visitor@example.com",
  subject: "Portfolio enquiry",
  message: "Hello, I would like to discuss an opportunity.",
};

const requestFor = (value: unknown, headers: Record<string, string> = {}) =>
  new Request("https://portfolio.example/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(value),
  });

async function checkResponse(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(["message", "success"]);
  expect(body.success).toBe(status === 200);
  expect(typeof body.message).toBe("string");
  expect(body.message.length).toBeGreaterThan(0);
  return body;
}

test("valid input is trimmed and only whitelisted fields reach the mailer", async () => {
  const delivered: unknown[] = [];
  const handler = createContactHandler(async (data) => { delivered.push(data); });
  const response = await handler(requestFor({
    email: ` ${valid.email} `, subject: ` ${valid.subject} `,
    message: ` ${valid.message} `, to: "attacker@example.com", attachments: ["/etc/passwd"],
  }, { Origin: "https://portfolio.example" }));
  expect(await checkResponse(response, 200)).toEqual({ success: true, message: "Email sent successfully" });
  expect(delivered).toEqual([valid]);
});

const invalidCases: [string, unknown][] = [
  ["null", null], ["array", []], ["primitive", "text"], ["missing fields", {}],
  ["missing message", { email: valid.email, subject: valid.subject }],
  ["numeric email", { ...valid, email: 123 }],
  ["array subject", { ...valid, subject: ["hello"] }],
  ["object message", { ...valid, message: { text: "hello" } }],
  ["empty email", { ...valid, email: "" }],
  ["whitespace subject", { ...valid, subject: "   " }],
  ["whitespace message", { ...valid, message: " \n\t " }],
  ["invalid email", { ...valid, email: "not-an-email" }],
  ["multiple mailboxes", { ...valid, email: "a@example.com,b@example.com" }],
  ["email header injection", { ...valid, email: "a@example.com\r\nBcc: x@example.com" }],
  ["subject header injection", { ...valid, subject: "Hello\r\nBcc: x@example.com" }],
  ["email over limit", { ...valid, email: "a".repeat(255) }],
  ["subject over limit", { ...valid, subject: "a".repeat(151) }],
  ["message over limit", { ...valid, message: "a".repeat(5001) }],
  ["null byte in message", { ...valid, message: "hello\u0000world" }],
];

for (const [name, value] of invalidCases) {
  test(`rejects ${name} without calling mail transport`, async () => {
    let calls = 0;
    const handler = createContactHandler(async () => { calls++; });
    await checkResponse(await handler(requestFor(value)), 400);
    expect(calls).toBe(0);
  });
}

test("accepts field limits, including a 254-character mailbox", async () => {
  const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
  expect(email.length).toBe(254);
  let calls = 0;
  const handler = createContactHandler(async () => { calls++; });
  await checkResponse(await handler(requestFor({ email, subject: "s".repeat(150), message: "m".repeat(5000) })), 200);
  expect(calls).toBe(1);
});

test("malformed JSON is 400 rather than an internal error", async () => {
  const response = await POST(new Request("https://portfolio.example/api/send", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken",
  }));
  await checkResponse(response, 400);
});

test("real exported route rejects invalid input before accessing SMTP", async () => {
  await checkResponse(await POST(requestFor({})), 400);
});

test("requires JSON content type", async () => {
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(requestFor(valid, { "Content-Type": "text/plain" })), 400);
});

test("accepts the public Host when Next.js uses an internal request URL", async () => {
  let calls = 0;
  const handler = createContactHandler(async () => { calls++; });
  const request = new Request("https://internal.example:3000/api/send", {
    method: "POST", headers: {
      "Content-Type": "application/json", Host: "portfolio.example",
      Origin: "https://portfolio.example",
    }, body: JSON.stringify(valid),
  });
  await checkResponse(await handler(request), 200);
  expect(calls).toBe(1);
});

test("a forged forwarded-host header does not allow a foreign Origin", async () => {
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(requestFor(valid, {
    Host: "portfolio.example", Origin: "https://untrusted.example",
    "X-Forwarded-Host": "untrusted.example",
  })), 403);
});

const foreignHeaders: Record<string, string>[] = [
  { Origin: "https://untrusted.example" },
  { "Sec-Fetch-Site": "cross-site" },
];
for (const headers of foreignHeaders) {
  test(`rejects cross-site browser metadata ${Object.keys(headers)[0]}`, async () => {
    let calls = 0;
    const handler = createContactHandler(async () => { calls++; });
    await checkResponse(await handler(requestFor(valid, headers)), 403);
    expect(calls).toBe(0);
  });
}

test("declared oversized body is rejected before sending", async () => {
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(requestFor(valid, { "Content-Length": "32769" })), 413);
});

test("streamed byte limit cannot be bypassed by a false Content-Length", async () => {
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(requestFor({ ...valid, padding: "x".repeat(32768) }, { "Content-Length": "1" })), 413);
});

test("body limit measures UTF-8 bytes, not character count", async () => {
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(requestFor({ ...valid, padding: "한".repeat(12000) })), 413);
});

test("exactly 32 KiB is allowed and one additional byte is rejected", async () => {
  const base = JSON.stringify({ ...valid, padding: "" });
  const body = JSON.stringify({ ...valid, padding: "x".repeat(32768 - Buffer.byteLength(base)) });
  expect(Buffer.byteLength(body)).toBe(32768);
  const handler = createContactHandler(async () => {});
  const make = (text: string) => new Request("https://portfolio.example/api/send", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: text,
  });
  await checkResponse(await handler(make(body)), 200);
  await checkResponse(await handler(make(body + " ")), 413);
});

test("a slow body times out and its stream is cancelled", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half",
  };
  const handler = createContactHandler(async () => { throw new Error("must not send"); });
  await checkResponse(await handler(new Request("https://portfolio.example/api/send", init)), 408);
  expect(cancelled).toBe(true);
});

test("unexpected failures return generic 500 without internal details", async () => {
  const handler = createContactHandler(async () => { throw new Error("sensitive-upstream-detail"); });
  const body = await checkResponse(await handler(requestFor(valid)), 500);
  expect(body.message).not.toContain("sensitive-upstream-detail");
});

// These fixtures are deliberately synthetic and never open a network transport.
const credentials = () => ({ user: "portfolio@example.com", pass: "test-only" });

test("trusted sender, replyTo, escaping and resource restrictions are applied", async () => {
  const messages: Mail.Options[] = [];
  let smtp: SMTPTransport.Options | undefined;
  let closed = false;
  const mailer = createContactMailer({
    getCredentials: credentials,
    createTransport(options) {
      smtp = options;
      return { sendMail: async (message) => { messages.push(message); }, close() { closed = true; } };
    },
  });
  const handler = createContactHandler(mailer);
  await checkResponse(await handler(requestFor({
    ...valid, subject: '<script>alert("x")</script>', message: '<img src=x onerror="alert(1)">\nA & B',
  })), 200);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toMatchObject({
    from: "portfolio@example.com", to: "portfolio@example.com", replyTo: valid.email,
    envelope: { from: "portfolio@example.com", to: ["portfolio@example.com"] },
    disableFileAccess: true, disableUrlAccess: true,
  });
  expect(messages[0].html).toContain("&lt;script&gt;");
  expect(messages[0].html).toContain("&lt;img");
  expect(messages[0].html).toContain("<br>A &amp; B");
  expect(messages[0].html).not.toContain("<script>");
  expect(messages[0].html).not.toContain("<img");
  expect(messages[0].text).toContain('<img src=x onerror="alert(1)">');
  expect(smtp).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, dnsTimeout: 5000 });
  expect(closed).toBe(true);
});

for (const bad of [{}, { user: "bad-address", pass: "test-only" },
  { user: "portfolio@example.com", pass: " " }, { user: "portfolio@example.com\n", pass: "test-only" }]) {
  test(`invalid sender configuration returns 503 (${JSON.stringify(bad.user ?? "missing")})`, async () => {
    let created = false;
    const mailer = createContactMailer({ getCredentials: () => bad,
      createTransport() { created = true; throw new Error("must not create transport"); } });
    await checkResponse(await createContactHandler(mailer)(requestFor(valid)), 503);
    expect(created).toBe(false);
  });
}

test("SMTP errors are 502, sanitised, and transport is closed", async () => {
  let closed = false;
  const mailer = createContactMailer({ getCredentials: credentials, createTransport: () => ({
    sendMail: async () => { throw new Error("sensitive-upstream-detail"); }, close() { closed = true; },
  }) });
  const body = await checkResponse(await createContactHandler(mailer)(requestFor(valid)), 502);
  expect(body.message).not.toContain("sensitive-upstream-detail");
  expect(closed).toBe(true);
});

// Actual timeout and socket cleanup behavior is exercised against loopback SMTP
// servers in contact-smtp.spec.ts, rather than inferred from a mock close().
