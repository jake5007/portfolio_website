"use client";

import { useState } from "react";
import { aboutTabs } from "@/data";
import TabBtn from "./TabBtn";

const AboutMeTabs = () => {
  const [currTab, setCurrTab] = useState("skills");

  return (
    <>
      <div className="flex gap-3 justify-center sm:justify-start mt-7">
        {aboutTabs.map((tab) => (
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
          {aboutTabs
            .find((tab) => currTab === tab.id)
            ?.content?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
        </ul>
      </div>
    </>
  );
};
export default AboutMeTabs;
