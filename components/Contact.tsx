"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import InputContainer from "./InputContainer";
import githubIcon from "@/public/images/github.svg";
import linkedInIcon from "@/public/images/linkedin.svg";

const Contact = () => {
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      console.log("message sent");
      setEmailSubmitted(true);
    }
  };

  return (
    <section id="contact" className="mt-10">
      <div className="flex justify-center gap-5 w-full">
        <Link href="https://github.com/jake5007" target="_blank">
          <Image
            src={githubIcon}
            alt="github"
            width={35}
            height={35}
            className="dark:invert"
          />
        </Link>
        <Link href="https://www.linkedin.com/in/hyunjinchae/" target="_blank">
          <Image
            src={linkedInIcon}
            alt="linkedIn"
            width={35}
            height={35}
            className="dark:invert"
          />
        </Link>
      </div>
      {emailSubmitted ? (
        <p className="text-green-500 text-lg text-center mt-5">
          Email sent successfully!
        </p>
      ) : (
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
            className="w-full md:max-w-[650px] rounded-lg py-3 
          bg-orange-500 hover:bg-orange-400 text-white
          tracking-wider"
          >
            Send
          </button>
        </form>
      )}
    </section>
  );
};
export default Contact;
