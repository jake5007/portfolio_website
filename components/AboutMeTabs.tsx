"use client";

import { useState } from "react";
import { aboutTabs } from "@/data";
import TabBtn from "./TabBtn";

const AboutMeTabs = () => {
  const [currTab, setCurrTab] = useState("skills");
  const current = aboutTabs.find((tab) => tab.id === currTab);

  return (
    <>
      <div role="group" aria-label="About categories" className="flex w-max max-w-[calc(100vw-1rem)] flex-wrap self-center sm:self-start gap-4 justify-center sm:justify-start mt-7">
        {aboutTabs.map((tab) => (
          <TabBtn
            key={tab.id}
            active={currTab === tab.id}
            onTabChange={() => setCurrTab(tab.id)}
          >
            {tab.title}
          </TabBtn>
        ))}
      </div>
      <div className="mt-5">
        <ul className="space-y-4">
          {current?.content.map((item) => (
            <li key={item.label} className="min-w-0">
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3">
                <span className="font-semibold">{item.label}</span>
                {item.period && (
                  <span className="text-xs text-base-content/70">{item.period}</span>
                )}
              </div>
              <p className="mt-1 text-sm sm:text-base break-words">{item.value}</p>
              {item.detail && (
                <p className="mt-1 text-sm text-base-content/80 break-words">
                  {item.detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default AboutMeTabs;
