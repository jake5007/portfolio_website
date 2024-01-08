"use client";

import Image from "next/image";
import { useState } from "react";
import { tabData } from "@/data";
import TabBtn from "./TabBtn";

const AboutMe = () => {
  const [currTab, setCurrTab] = useState("skills");

  return (
    <section id="about" className="sm:mt-10">
      <div
        className="flex flex-col md:flex-row  
        gap-10 lg:gap-16 md:items-start w-full"
      >
        <Image
          src="/images/website-image.svg"
          alt="about image"
          width={500}
          height={500}
        />

        <div className="flex flex-col text-white h-full text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-left">About Me</h1>
          <p className="mt-3 text-slate-300">
            I am a web developer with a passion for diving into new challenges.
            I have working experience with JavaScript, Vue, HTML, CSS, and Git.
            However, I've pursued learning React, Redux, Node.js, Next.js, and
            Figma on my own. I am a quick learner and a team player, looking for
            an opportunity to expand my knowledge and contribute to
            collaborative projects.
          </p>
          <div className="flex gap-3 justify-start mt-7">
            {tabData.map((tab) => (
              <TabBtn
                key={tab.id}
                active={currTab === tab.id}
                onTabChange={() => setCurrTab((prev) => tab.id)}
              >
                {tab.title}
              </TabBtn>
            ))}
          </div>
          <div className="mt-5">
            <ul className="list-disc pl-4">
              {tabData
                .find((tab) => currTab === tab.id)
                ?.content?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
export default AboutMe;
