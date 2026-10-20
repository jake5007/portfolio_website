import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { ContactFormData } from "@/types";
import { isValidEmail } from "./contact";

export class ContactMailError extends Error {
  constructor(public readonly status: 502 | 503) {
    super("Contact mail service unavailable");
    this.name = "ContactMailError";
  }
}

type MailTransport = {
  sendMail: (message: Mail.Options) => Promise<unknown>;
  close: () => void;
};
type MailerOptions = {
  getCredentials?: () => { user?: string; pass?: string };
  createTransport?: (options: SMTPTransport.Options) => MailTransport;
};
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

// Tests replace the transport. Production retains Gmail and never accepts
// transport options, recipients, or attachments from the visitor.
export function createContactMailer(options: MailerOptions = {}) {
  const getCredentials =
    options.getCredentials ??
    (() => ({ user: process.env.AUTH_USER, pass: process.env.AUTH_PASS }));
  const createTransport = options.createTransport ?? nodemailer.createTransport;

  return async (data: ContactFormData): Promise<void> => {
    const { user, pass } = getCredentials();
    if (!user || !isValidEmail(user) || !pass?.trim()) {
      throw new ContactMailError(503);
    }
    let transport: MailTransport | undefined;
    try {
      transport = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
        dnsTimeout: 5000,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
      // Await the real operation: non-pooled transport.close() does not cancel
      // an in-flight send. Native timeouts close the SMTP connection on failure;
      // socketTimeout bounds inactivity, not the total transaction duration.
      await transport.sendMail({
        from: user,
        to: user,
        replyTo: data.email,
        envelope: { from: user, to: [user] },
        subject: `[From Portfolio] ${data.subject}`,
        text: `${data.subject}\n\n${data.message}\n\nFrom: ${data.email}`,
        html: `<h1>${escapeHtml(data.subject)}</h1><p>${escapeHtml(
          data.message
        ).replace(/\r\n?|\n/g, "<br>")}</p><p><strong>From:</strong> ${escapeHtml(
          data.email
        )}</p>`,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    } catch (error) {
      if (error instanceof ContactMailError) throw error;
      // SMTP responses can contain credentials or message contents.
      const timedOut =
        typeof error === "object" && error !== null &&
        "code" in error && error.code === "ETIMEDOUT";
      throw new ContactMailError(timedOut ? 503 : 502);
    } finally {
      // Only release transport-level resources after sendMail has settled.
      // Socket teardown belongs to Nodemailer's completed send/error path.
      transport?.close();
    }
  };
}
