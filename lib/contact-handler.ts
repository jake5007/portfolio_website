import type { ContactFormData } from "@/types";
import { CONTACT_LIMITS, validateContactForm } from "./contact";
import { ContactMailError } from "./contact-mail";

class ContactRequestError extends Error {
  constructor(public readonly status: 400 | 408 | 413, message: string) {
    super(message);
  }
}
const respond = (status: number, message: string) =>
  Response.json(
    { success: status >= 200 && status < 300, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host === null) return url.origin;

  // Next.js can use an internal hostname in Request.url. Host is the public
  // HTTP authority; do not accept arbitrary X-Forwarded-Host overrides.
  try {
    const publicUrl = new URL(`${url.protocol}//${host}`);
    if (
      publicUrl.username || publicUrl.password || publicUrl.pathname !== "/" ||
      publicUrl.search || publicUrl.hash
    ) {
      throw new Error("Invalid authority");
    }
    return publicUrl.origin;
  } catch {
    throw new ContactRequestError(400, "Invalid request host.");
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length)) {
      throw new ContactRequestError(400, "Invalid request size.");
    }
    if (Number(length) > CONTACT_LIMITS.bodyBytes) {
      void request.body?.cancel().catch(() => {});
      throw new ContactRequestError(413, "The request is too large.");
    }
  }
  if (!request.body) {
    throw new ContactRequestError(400, "Please provide a JSON request body.");
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let complete = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = Date.now() + 5000;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ContactRequestError(408, "The request timed out.")),
      5000
    );
  });
  try {
    while (true) {
      if (Date.now() > deadline) {
        throw new ContactRequestError(408, "The request timed out.");
      }
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) {
        complete = true;
        break;
      }
      size += value.byteLength;
      if (size > CONTACT_LIMITS.bodyBytes) {
        throw new ContactRequestError(413, "The request is too large.");
      }
      if (value.byteLength) chunks.push(value);
    }
    try {
      return JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
      );
    } catch {
      throw new ContactRequestError(400, "Please provide valid JSON.");
    }
  } finally {
    clearTimeout(timer);
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createContactHandler(
  sendMail: (data: ContactFormData) => Promise<void>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const origin = request.headers.get("origin");
      if (
        request.headers.get("sec-fetch-site") === "cross-site" ||
        (origin !== null && origin !== requestOrigin(request))
      ) {
        return respond(403, "This request is not allowed.");
      }
      if (
        request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
        "application/json"
      ) {
        return respond(400, "Please send a JSON request.");
      }
      const input = validateContactForm(await readJsonBody(request));
      if (!input.valid) return respond(400, input.message);
      await sendMail(input.data);
      return respond(200, "Email sent successfully");
    } catch (error) {
      if (error instanceof ContactRequestError) {
        return respond(error.status, error.message);
      }
      if (error instanceof ContactMailError) {
        return respond(
          error.status,
          "The email service is temporarily unavailable. Please try again later."
        );
      }
      return respond(500, "Unable to send your message. Please try again later.");
    }
  };
}
