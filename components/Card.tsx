import { type CardProps } from "@/types";
import Link from "next/link";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

const Card = ({ title, desc, imgSrc, gitURL }: CardProps) => {
  return (
    <div className="card card-compact bg-base-100 shadow-xl h-full">
      <figure className="relative h-[55%] group">
        <img
          src={imgSrc}
          alt={title}
          className="object-cover transition duration-200 group-hover:ease-in group-hover:scale-110"
        />
        <div
          className="group-hover:flex justify-center items-center hidden 
          absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] z-10"
        >
          <Link href={gitURL} target="_blank">
            <CodeBracketIcon className="w-10 h-10 text-[#fff]" />
          </Link>
        </div>
      </figure>
      <div className="card-body dark:bg-[#292929]">
        <h2 className="card-title dark:text-white">{title}</h2>
        <p className="dark:text-slate-400">{desc}</p>
      </div>
    </div>
  );
};
export default Card;
