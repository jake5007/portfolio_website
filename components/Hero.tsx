"use client";

import Link from "next/link";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="col-span-7 place-self-center text-center sm:text-left"
        >
          <h1 className="mb-5 text-4xl sm:text-5xl lg:text-6xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Hello, I&apos;m{" "}
            </span>
            <br />
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
                "현진",
                1500,
                "Hyunjin",
                1000, // wait 1s before replacing "Mice" with "Hamsters"
                "Web Developer",
                1000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </h1>
          <p className="text-base sm:text-lg lg:text-xl">
            Welcome! Thank you for visiting my website. Hope you find something
            interesting here {":)"}
          </p>
          <div className="mt-4">
            <Link href="#contact">
              <button className="px-8 py-3 mb-4 rounded-full text-base-content bg-gradient-to-br from-primary via-secondary to-accent hover:opacity-80 transition-opacity duration-200 w-full sm:w-fit">
                Hire Me
              </button>
            </Link>
          </div>
        </motion.div>
        <div className="col-span-5 place-self-center mt-4 lg:mt-0">
          <div className="bg-[#212121] rounded-full w-[250px] h-[250px] lg:w-[400px] lg:h-[400px] relative">
            <Image
              src="/images/programming-image.svg"
              alt="hero image"
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
