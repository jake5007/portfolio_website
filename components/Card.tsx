"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CardProps } from "@/types";
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const Card = ({ title, desc, imgSrc, liveURL, gitURL }: CardProps) => {
  const [touchOpen, setTouchOpen] = useState(false);
  const figure = useRef<HTMLElement>(null);
  const touchStartedOnImage = useRef(false);

  useEffect(() => {
    if (!touchOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !figure.current?.contains(event.target)) {
        touchStartedOnImage.current = false;
        setTouchOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [touchOpen]);

  return (
    <div className="card card-compact bg-base-100 shadow-xl h-full">
      <figure ref={figure} className="relative h-[55%] group"
        data-touch-open={touchOpen ? "true" : undefined}
        onPointerDownCapture={event => {
          touchStartedOnImage.current = event.pointerType === "touch" &&
            event.target instanceof Element && !event.target.closest("a");
        }}
        onPointerCancel={() => { touchStartedOnImage.current = false; }}
        onClickCapture={event => {
          const reveal = touchStartedOnImage.current;
          touchStartedOnImage.current = false;
          if (reveal && event.detail !== 0) {
            // Touch can synthesize hover before click and retarget it to a
            // newly visible link. The image gesture only reveals the actions;
            // subsequent link taps and native mouse/keyboard clicks stay native.
            event.preventDefault();
            event.stopPropagation();
            setTouchOpen(true);
          } else if (event.target instanceof Element && event.target.closest("a")) {
            // Navigation ends the explicit touch reveal. Keep native focus:
            // keyboard focus-visible, unlike pointer focus, still shows actions.
            setTouchOpen(false);
          }
        }}>
        <Image
          src={imgSrc}
          alt={title}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto object-cover transition duration-200 group-hover:ease-in group-hover:scale-110"
        />
        <div
          className="project-actions flex justify-center items-center gap-3
          absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] z-10"
        >
          <Link href={liveURL} target="_blank" rel="noopener noreferrer" aria-label={`${title}: live site (opens in a new tab)`}>
            <div className="border p-2 rounded-xl">
              <ArrowTopRightOnSquareIcon className="w-10 h-10 text-[#fff]" />
            </div>
          </Link>
          <Link href={gitURL} target="_blank" rel="noopener noreferrer" aria-label={`${title}: source code (opens in a new tab)`}>
            <div className="border p-2 rounded-xl">
              <CodeBracketIcon className="w-10 h-10 text-[#fff]" />
            </div>
          </Link>
        </div>
      </figure>
      <div className="card-body rounded-b-2xl">
        <h3 className="card-title xl:text-2xl">{title}</h3>
        <p className="xl:text-lg">{desc}</p>
      </div>
    </div>
  );
};
export default Card;
