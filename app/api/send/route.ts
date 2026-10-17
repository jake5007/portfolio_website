import { createContactHandler } from "@/lib/contact-handler";
import { createContactMailer } from "@/lib/contact-mail";

export const runtime = "nodejs";

export const POST = createContactHandler(createContactMailer());
