import { test as base, expect } from "@playwright/test";
import { createConnection, createServer, type Socket } from "node:net";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { createContactHandler } from "../lib/contact-handler";
import { createContactMailer } from "../lib/contact-mail";

type Mode = "silent" | "success" | "delayed-ehlo" | "delayed-mail" |
  "stalled-final" | "reject-recipient" | "slow-progress";

// A loopback-only SMTP sink: it never relays mail, advertises AUTH or reads env.
// Timers and both ends of any explicitly owned sockets are released on failure.
class LocalSmtp {
  modes: Mode[] = [];
  mode: Mode = "success";
  halfOpen = false;
  readonly sockets = new Set<Socket>();
  readonly ownedClients = new Set<Socket>();
  readonly commands: string[] = [];
  readonly messages: string[] = [];
  readonly timers = new Set<ReturnType<typeof setTimeout>>();
  connections = 0;
  acknowledgements = 0;
  receivedBytes = 0;
  readonly server = createServer({ allowHalfOpen: true }, (socket) => {
    const mode = this.modes.shift() ?? this.mode;
    this.connections++;
    this.sockets.add(socket);
    const timers = new Set<ReturnType<typeof setTimeout>>();
    socket.on("error", () => { /* Peers may reset during timeout teardown. */ });
    socket.on("end", () => { if (!this.halfOpen) socket.end(); });
    socket.on("close", () => {
      this.sockets.delete(socket);
      for (const timer of Array.from(timers)) {
        clearTimeout(timer);
        this.timers.delete(timer);
      }
    });
    const delayed = (text: string, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        this.timers.delete(timer);
        if (!socket.destroyed && !socket.writableEnded) socket.write(text);
      }, delay);
      timers.add(timer);
      this.timers.add(timer);
    };
    if (mode !== "silent") socket.write("220 loopback.example ESMTP\r\n");
    let buffer = "";
    let data: string[] | undefined;
    socket.on("data", (chunk: Buffer) => {
      this.receivedBytes += chunk.length;
      if (mode === "silent") return;
      buffer += chunk.toString("utf8");
      let end: number;
      while ((end = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line !== ".") {
            data.push(line.startsWith("..") ? line.slice(1) : line);
            continue;
          }
          this.messages.push(data.join("\r\n"));
          data = undefined;
          if (mode === "stalled-final") continue;
          this.acknowledgements++;
          socket.write("250 2.0.0 Accepted by local sink\r\n");
          continue;
        }
        this.commands.push(line);
        if (/^(EHLO|HELO) /i.test(line)) {
          if (mode === "delayed-ehlo") delayed("250 loopback.example\r\n", 300);
          else if (mode === "slow-progress") {
            socket.write("250-loopback.example\r\n");
            for (const delay of [5000, 10_000, 15_000, 20_000, 25_000]) {
              delayed("250-Still processing\r\n", delay);
            }
            delayed("250 loopback.example\r\n", 26_000);
          }
          else socket.write("250 loopback.example\r\n");
        } else if (/^MAIL FROM:/i.test(line)) {
          if (mode === "delayed-mail") delayed("250 Sender OK\r\n", 1500);
          else socket.write("250 Sender OK\r\n");
        } else if (/^RCPT TO:/i.test(line)) {
          socket.write(mode === "reject-recipient" ? "550 Recipient rejected\r\n" : "250 Recipient OK\r\n");
        } else if (line === "DATA") {
          data = [];
          socket.write("354 End with a single dot\r\n");
        } else if (line === "QUIT") {
          socket.end("221 Goodbye\r\n");
        } else socket.write("500 Unexpected test command\r\n");
      }
    });
  });

  get port() {
    const address = this.server.address();
    if (!address || typeof address === "string") throw new Error("SMTP sink is not listening");
    return address.port;
  }

  async start() {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", () => {
        this.server.removeListener("error", reject);
        resolve();
      });
    });
  }

  async connectClient() {
    const socket = createConnection({ host: "127.0.0.1", port: this.port });
    this.ownedClients.add(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.once("connect", () => {
        socket.removeListener("error", reject);
        resolve();
      });
    });
    socket.on("error", () => {});
    return socket;
  }

  async stop() {
    for (const timer of Array.from(this.timers)) clearTimeout(timer);
    this.timers.clear();
    for (const socket of [...Array.from(this.sockets), ...Array.from(this.ownedClients)]) socket.destroy();
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => error ? reject(error) : resolve());
    });
  }
}

const test = base.extend<{ smtp: LocalSmtp }>({
  smtp: async ({}, runTest) => {
    const smtp = new LocalSmtp();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      await smtp.start();
      await runTest(smtp);
    } finally {
      try {
        await smtp.stop();
        // Include late rejections caused by socket teardown in the assertion.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(unhandled).toEqual([]);
      } finally {
        process.off("unhandledRejection", onUnhandled);
      }
    }
  },
});

const input = {
  email: "visitor@example.com", subject: "Local SMTP verification",
  message: "Hello <world>\nA & B",
};
const request = () => new Request("https://portfolio.example/api/send", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});

function localHandler(smtp: LocalSmtp, overrides: SMTPTransport.Options = {}) {
  let active = 0;
  const errors: string[] = [];
  const mailer = createContactMailer({
    getCredentials: () => ({ user: "portfolio@example.com", pass: "test-only" }),
    createTransport(defaults) {
      const transport = nodemailer.createTransport({
        ...defaults, host: "127.0.0.1", port: smtp.port,
        secure: false, ignoreTLS: true, auth: undefined,
        dnsTimeout: 500, connectionTimeout: 2000,
        greetingTimeout: 1000, socketTimeout: 250, ...overrides,
      });
      return {
        async sendMail(message) {
          active++;
          try {
            return await transport.sendMail(message);
          } catch (error) {
            errors.push(typeof error === "object" && error !== null && "code" in error
              ? String(error.code) : "unknown");
            throw error;
          } finally {
            active--;
          }
        },
        close: () => transport.close(),
      };
    },
  });
  return { post: createContactHandler(mailer), active: () => active, errors };
}

async function failure(response: Response, status: 502 | 503) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
    success: false,
    message: "The email service is temporarily unavailable. Please try again later.",
  });
}

async function cleaned(smtp: LocalSmtp, handler: ReturnType<typeof localHandler>) {
  // Observe real peer closure before fixture teardown destroys any sockets.
  expect(handler.active()).toBe(0);
  await expect.poll(() => smtp.sockets.size, { timeout: 1500 }).toBe(0);
  expect(smtp.timers.size).toBe(0);
}

test("connection timeout closes a real TCP socket during stalled TLS setup", async ({ smtp }) => {
  smtp.mode = "silent";
  const handler = localHandler(smtp, {
    secure: true, connectionTimeout: 250, greetingTimeout: 2000, socketTimeout: 2000,
  });
  await failure(await handler.post(request()), 503);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
  expect(smtp.connections).toBe(1);
  expect(smtp.receivedBytes).toBeGreaterThan(0); // A real TLS ClientHello reached the sink.
  expect(smtp.messages).toEqual([]);
  await cleaned(smtp, handler);
});

test("greeting timeout settles the send and closes the SMTP socket", async ({ smtp }) => {
  smtp.mode = "silent";
  const handler = localHandler(smtp, { greetingTimeout: 200, socketTimeout: 2000 });
  await failure(await handler.post(request()), 503);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
  expect(smtp.connections).toBe(1);
  expect(smtp.commands).toEqual([]);
  await cleaned(smtp, handler);
});

test("delayed SMTP response inside the idle limit succeeds with unchanged mail formatting", async ({ smtp }) => {
  smtp.mode = "delayed-ehlo";
  const handler = localHandler(smtp, { socketTimeout: 1000 });
  const response = await handler.post(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true, message: "Email sent successfully" });
  expect(handler.errors).toEqual([]);
  expect(smtp.acknowledgements).toBe(1);
  expect(smtp.messages).toHaveLength(1);
  expect(smtp.commands).toContain("MAIL FROM:<portfolio@example.com>");
  expect(smtp.commands).toContain("RCPT TO:<portfolio@example.com>");
  const message = smtp.messages[0];
  expect(message).toContain("From: portfolio@example.com\r\n");
  expect(message).toContain("To: portfolio@example.com\r\n");
  expect(message).toContain("Reply-To: visitor@example.com\r\n");
  expect(message).toContain("Subject: [From Portfolio] Local SMTP verification\r\n");
  expect(message).toContain("Content-Type: text/plain;");
  expect(message).toContain("Content-Type: text/html;");
  expect(message).toContain("&lt;world&gt;");
  expect(message).not.toContain("test-only");
  await cleaned(smtp, handler);
});

test("a response delayed beyond socketTimeout fails before any DATA transmission", async ({ smtp }) => {
  smtp.mode = "delayed-mail";
  const handler = localHandler(smtp);
  await failure(await handler.post(request()), 503);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
  expect(smtp.commands.some((command) => command.startsWith("MAIL FROM:"))).toBe(true);
  expect(smtp.commands).not.toContain("DATA");
  expect(smtp.messages).toEqual([]);
  await cleaned(smtp, handler);
});

test("SMTP progress beyond the former 25-second race is awaited rather than abandoned", async ({ smtp }) => {
  test.setTimeout(35_000);
  smtp.mode = "slow-progress";
  const handler = localHandler(smtp, { socketTimeout: 7000 });
  // Real network progress resets the idle timeout. The former Promise.race
  // would return 503 after 25 seconds with sendMail still active on this socket.
  const response = await handler.post(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true, message: "Email sent successfully" });
  expect(handler.errors).toEqual([]);
  expect(smtp.acknowledgements).toBe(1);
  expect(smtp.messages).toHaveLength(1);
  await cleaned(smtp, handler);
});

test("stalled final SMTP acknowledgement times out without claiming non-delivery", async ({ smtp }) => {
  smtp.mode = "stalled-final";
  const handler = localHandler(smtp);
  await failure(await handler.post(request()), 503);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
  // DATA reached the peer despite the failure. A missing 250 cannot prove that
  // a real provider did not accept the message; the sink never relays it.
  expect(smtp.messages).toHaveLength(1);
  expect(smtp.acknowledgements).toBe(0);
  await cleaned(smtp, handler);
});

test("SMTP rejection returns sanitised 502 and releases the connection", async ({ smtp }) => {
  smtp.mode = "reject-recipient";
  const handler = localHandler(smtp);
  await failure(await handler.post(request()), 502);
  expect(handler.errors).toEqual(["EENVELOPE"]);
  expect(smtp.messages).toEqual([]);
  await cleaned(smtp, handler);
});

test("a submission after timeout opens a fresh connection and can succeed", async ({ smtp }) => {
  smtp.modes = ["silent", "success"];
  const handler = localHandler(smtp, { greetingTimeout: 200, socketTimeout: 1000 });
  await failure(await handler.post(request()), 503);
  await cleaned(smtp, handler);
  const retry = await handler.post(request());
  expect(retry.status).toBe(200);
  expect(await retry.json()).toEqual({ success: true, message: "Email sent successfully" });
  await cleaned(smtp, handler);
  expect(smtp.connections).toBe(2);
  expect(smtp.messages).toHaveLength(1);
  expect(smtp.acknowledgements).toBe(1);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
});

test("a half-open peer is forcibly released after Nodemailer's bounded close grace period", async ({ smtp }) => {
  smtp.mode = "silent";
  smtp.halfOpen = true;
  const client = await smtp.connectClient();
  // connection is a public SMTP option. Retain this test-owned socket to observe
  // local destruction even when the peer deliberately refuses to send its FIN.
  const handler = localHandler(smtp, {
    connection: client, greetingTimeout: 200, socketTimeout: 2000,
  });
  await failure(await handler.post(request()), 503);
  expect(handler.active()).toBe(0);
  expect(handler.errors).toEqual(["ETIMEDOUT"]);
  expect(client.writableEnded).toBe(true);
  expect(client.destroyed).toBe(false);
  // Native cleanup can take up to five seconds; close() is not instant abort.
  await expect.poll(() => client.destroyed, {
    timeout: 6500, intervals: [25, 50, 100],
  }).toBe(true);
  expect(smtp.messages).toEqual([]);
});
