import type { ContactFormData } from "@/types";

// Field limits use UTF-16 code units, matching HTML maxLength.
export const CONTACT_LIMITS = {
  email: 254,
  subject: 150,
  message: 5000,
  bodyBytes: 32 * 1024,
} as const;

export const CONTACT_REQUEST_TIMEOUT_MS = 35_000;
export type ContactResponse = { success: boolean; message: string };

export const isContactResponse = (value: unknown): value is ContactResponse =>
  typeof value === "object" &&
  value !== null &&
  "success" in value &&
  typeof value.success === "boolean" &&
  "message" in value &&
  typeof value.message === "string" &&
  value.message.trim().length > 0 &&
  value.message.length <= 300;

const hasHeaderControls = (value: string) =>
  value
    .split("")
    .some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

// A single unquoted mailbox, not a display name or recipient list.
export const isValidEmail = (value: string): boolean =>
  !hasHeaderControls(value) &&
  value.length <= CONTACT_LIMITS.email &&
  value.split("@")[0].length <= 64 &&
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    value
  );

type ValidationResult =
  | { valid: true; data: ContactFormData }
  | { valid: false; message: string };

export function validateContactForm(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, message: "Invalid contact form data." };
  }
  if (
    !("email" in value) ||
    !("subject" in value) ||
    !("message" in value) ||
    typeof value.email !== "string" ||
    typeof value.subject !== "string" ||
    typeof value.message !== "string"
  ) {
    return { valid: false, message: "Please complete all fields with valid text." };
  }
  if (
    value.email.length > CONTACT_LIMITS.email ||
    value.subject.length > CONTACT_LIMITS.subject ||
    value.message.length > CONTACT_LIMITS.message
  ) {
    return { valid: false, message: "One or more fields exceed the allowed length." };
  }
  if (hasHeaderControls(value.email) || hasHeaderControls(value.subject)) {
    return { valid: false, message: "Email and subject must be single-line text." };
  }
  const data = {
    email: value.email.trim(),
    subject: value.subject.trim(),
    message: value.message.trim(),
  };
  if (!data.email || !data.subject || !data.message) {
    return { valid: false, message: "Please complete all fields." };
  }
  if (!isValidEmail(data.email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }
  if (data.message.includes(String.fromCharCode(0))) {
    return { valid: false, message: "The message contains invalid characters." };
  }
  return { valid: true, data };
}
