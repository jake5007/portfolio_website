import Link from "next/link";
import { type NavLinkProps } from "@/types";

const NavLink = ({ href, title }: NavLinkProps) => {
  return (
    <Link
      href={href}
      className="block py-2 pl-3 pr-4 sm:text-xl rounded text-gray-400 hover:text-white"
    >
      {title}
    </Link>
  );
};
export default NavLink;
