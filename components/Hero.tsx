"use client";

import Image from "next/image";
import { TypeAnimation } from "react-type-animation";

const Hero = () => {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-12">
        <div className="col-span-7 place-self-center text-center sm:text-left">
          <h1 className="text-white mb-5 text-4xl sm:text-5xl lg:text-6xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6347] via-[#FFA07A] to-[#FFD700]">
              Hello, I'm{" "}
            </span>
            <br />
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
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
          <p className="text-[#7FC7D9] text-base sm:text-lg lg:text-xl">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Maxime
            incidunt excepturi architecto impedit numquam? Facere veniam rem
            reiciendis asperiores amet vel neque, odio sunt veritatis qui
            sapiente magni, dolorum perferendis!
          </p>
          <div className="mt-4">
            <button className="px-7 py-3 rounded-full mr-5 text-white bg-gradient-to-br from-[#FF6347] via-[#FFA07A] to-[#FFD700] hover:bg-slate-200 w-full sm:w-fit">
              Hire Me
            </button>
            <button className="px-1 py-1 mt-4 rounded-full text-white bg-gradient-to-br from-[#FF6347] via-[#FFA07A] to-[#FFD700] w-full sm:w-fit">
              <span className="px-6 py-2 block rounded-full bg-[#121212] hover:bg-slate-800">
                Download CV
              </span>
            </button>
          </div>
        </div>
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
