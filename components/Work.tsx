"use client";

import { useState } from "react";

import TabBtn from "./TabBtn";
import Card from "./Card";
import { workTabs, workList } from "@/data";

const Work = () => {
  const [currTab, setCurrTab] = useState("all");

  return (
    <section id="work" className="sm:mt-5">
      <h1 className="text-white text-center text-2xl md:text-3xl font-bold">
        My Work
      </h1>

      <div className="flex gap-3 justify-center my-6">
        {workTabs.map((tab) => (
          <TabBtn
            key={tab.id}
            active={currTab === tab.id}
            onTabChange={() => setCurrTab((prev) => tab.id)}
            customTextClasses="text-lg sm:text-xl decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8"
          >
            {tab.title}
          </TabBtn>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-center gap-8">
        {workList
          .filter((work) => work.category.includes(currTab))
          .map((work) => (
            <Card
              key={work.id}
              title={work.title}
              desc={work.desc}
              imgSrc={work.imgSrc}
              liveURL={work.liveURL}
              gitURL={work.gitURL}
            />
          ))}
      </div>
    </section>
  );
};
export default Work;
