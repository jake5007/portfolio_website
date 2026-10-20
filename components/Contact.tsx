"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import InputContainer from "./InputContainer";
import GithubIcon from "@/public/images/github.svg";
import LinkedInIcon from "@/public/images/linkedin.svg";
import toast from "react-hot-toast";
import {
  CONTACT_LIMITS,
  CONTACT_REQUEST_TIMEOUT_MS,
  isContactResponse,
  validateContactForm,
} from "@/lib/contact";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending.current) return;

    const form = e.currentTarget;
    const values = new FormData(form);
    const input = validateContactForm({
      email: values.get("email"),
      subject: values.get("subject"),
      message: values.get("message"),
    });
    if (!input.valid) {
      toast.error(input.message);
      return;
    }

    pending.current = true;
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONTACT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify(input.data),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!isContactResponse(data)) {
        toast.error("We could not confirm your message was sent. Please try again.");
        return;
      }
      if (!response.ok || !data.success) {
        toast.error(
          data.success
            ? "Unable to send your message. Please try again later."
            : data.message
        );
        return;
      }

      toast.success(data.message + " :)");
      form.reset();
    } catch {
      toast.error(
        controller.signal.aborted
          ? "The request timed out. Please try again."
          : "Could not connect. Please check your connection and try again."
      );
    } finally {
      clearTimeout(timer);
      pending.current = false;
      setLoading(false);
    }
  };

  return (
    <section id="contact" tabIndex={-1} aria-label="Contact" className="mt-10">
      <div className="flex justify-center gap-8 w-full my-5">
        <Link href="https://github.com/jake5007" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile (opens in a new tab)">
          <GithubIcon className="size-10 text-base-content hover:opacity-80 transition-opacity duration-200" />
        </Link>
        <Link href="https://www.linkedin.com/in/hyunjinchae/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile (opens in a new tab)">
          <LinkedInIcon className="size-10 text-base-content hover:opacity-80 transition-opacity duration-200" />
        </Link>
      </div>

      <form
        aria-label="Contact"
        className="flex flex-col items-center w-full"
        onSubmit={handleSubmit}
      >
        <InputContainer
          label="Your Email"
          name="email"
          type="email"
          maxLength={CONTACT_LIMITS.email}
          placeholder="abcd@gmail.com"
        />
        <InputContainer
          label="Subject"
          name="subject"
          type="text"
          maxLength={CONTACT_LIMITS.subject}
          placeholder="I want to have a coffee chat..."
        />
        <InputContainer
          label="Message"
          name="message"
          placeholder="Hello, I'm..."
          textarea
          maxLength={CONTACT_LIMITS.message}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full md:max-w-[650px] rounded-lg 
            hover:opacity-80 transition-opacity duration-200
            tracking-wider font-semibold text-lg text-center"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
};
export default Contact;
