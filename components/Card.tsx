import Link from "next/link";
import Image from "next/image";
import type { CardProps } from "@/types";
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const Card = ({ title, desc, imgSrc, liveURL, gitURL }: CardProps) => {
  return (
    <div className="card card-compact bg-base-100 shadow-xl h-full">
      <figure className="relative h-[55%] group">
        <Image
          src={imgSrc}
          alt={title}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto object-cover transition duration-200 group-hover:ease-in group-hover:scale-110"
        />
        <div
          className="group-hover:flex justify-center items-center gap-3 hidden 
          absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] z-10"
        >
          <Link href={liveURL} target="_blank">
            <div className="border p-2 rounded-xl">
              <ArrowTopRightOnSquareIcon className="w-10 h-10 text-[#fff]" />
            </div>
          </Link>
          <Link href={gitURL} target="_blank">
            <div className="border p-2 rounded-xl">
              <CodeBracketIcon className="w-10 h-10 text-[#fff]" />
            </div>
          </Link>
        </div>
      </figure>
      <div className="card-body rounded-b-2xl">
        <h2 className="card-title xl:text-2xl">{title}</h2>
        <p className="xl:text-lg">{desc}</p>
      </div>
    </div>
  );
};
export default Card;
