"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { hobbies } from "@/data";
import CarouselWithDesc from "./CarouselWithDesc";

const Hobbies = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section id="hobbies" className="sm:mt-10">
      <h1 className="text-primary text-center text-2xl md:text-3xl font-bold">
        My Hobbies
      </h1>

      <div
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-3 items-center gap-5"
      >
        {hobbies.map((hobby) => (
          <CarouselWithDesc key={hobby.id} isInView={isInView} {...hobby} />
        ))}
      </div>
    </section>
  );
};
export default Hobbies;
