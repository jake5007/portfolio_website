"use client";

import { useState } from "react";
import Link from "next/link";
import InputContainer from "./InputContainer";
import GithubIcon from "@/public/images/github.svg";
import LinkedInIcon from "@/public/images/linkedin.svg";
import toast from "react-hot-toast";

const Contact = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = {
      email: e.target.email.value,
      subject: e.target.subject.value,
      message: e.target.message.value,
    };

    const response = await fetch("/api/send", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.status === 200) {
      toast.success(data.message + " :)");

      e.target.email.value = "";
      e.target.subject.value = "";
      e.target.message.value = "";
    } else {
      toast.error(data.message);
    }

    setLoading(false);
  };

  return (
    <section id="contact" className="mt-10">
      <div className="flex justify-center gap-8 w-full my-5">
        <Link href="https://github.com/jake5007" target="_blank">
          <GithubIcon className="size-10 text-base-content hover:opacity-80 transition-opacity duration-200" />
        </Link>
        <Link href="https://www.linkedin.com/in/hyunjinchae/" target="_blank">
          <LinkedInIcon className="size-10 text-base-content hover:opacity-80 transition-opacity duration-200" />
        </Link>
      </div>

      <form
        className="flex flex-col items-center w-full"
        onSubmit={handleSubmit}
      >
        <InputContainer
          label="Your Email"
          name="email"
          type="email"
          placeholder="abcd@gmail.com"
        />
        <InputContainer
          label="Subject"
          name="subject"
          type="text"
          placeholder="I want to have a coffee chat..."
        />
        <InputContainer
          label="Message"
          name="message"
          placeholder="Hello, I'm..."
          textarea
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
