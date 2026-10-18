"use client";

import Image from "next/image";
import { useState } from "react";
import TypewriterName from "@/components/TypewriterName";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const Hero = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [animationStopped, setAnimationStopped] = useState(false);
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="hero-intro sm:col-span-7 min-w-0 place-self-center text-center sm:text-left"
        >
          <h1 className="mb-5 text-4xl sm:text-5xl lg:text-6xl font-bold">
            <span className="readable-gradient text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Hello, I&apos;m{" "}
            </span>
            <br />
            <span className="sr-only">현진, Hyunjin, QA Engineer</span>
            <span aria-hidden="true" className={animationStopped ? "static-name" : "reduced-motion-name"}>현진</span>
            {!reducedMotion && !animationStopped && <span aria-hidden="true" className="motion-typing"><TypewriterName /></span>}
          </h1>
          {!reducedMotion && <button type="button"
            className="motion-control btn btn-ghost btn-xs mb-3"
            onClick={() => setAnimationStopped(!animationStopped)}>
            {animationStopped ? "Restart animation" : "Stop animation"}
          </button>}
          <p className="text-base sm:text-lg lg:text-xl text-left">
            With a background in software development, I focus on improving
            software quality through systematic testing, problem-solving, and
            automation.
          </p>
          <div className="mt-4">
            <a href="#contact" className="hire-link inline-block px-8 py-3 mb-4 rounded-full bg-gradient-to-br from-primary via-secondary to-accent hover:underline w-full sm:w-fit">
                Hire Me
            </a>
          </div>
        </motion.div>
        <div className="sm:col-span-5 min-w-0 max-w-full place-self-center mt-4 lg:mt-0">
          <div className="bg-[#212121] rounded-full w-[250px] max-w-full aspect-square lg:w-[400px] relative">
            <Image
              src="/images/programming-image.svg"
              alt="Illustration of a person programming"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              width={300}
              height={300}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
