import Link from "next/link";
import type { NavLinkProps } from "@/types";

const NavLink = ({ href, title }: NavLinkProps) => {
  return (
    <Link
      href={href}
      className="block py-2 pl-2 pr-3 sm:text-lg lg:text-xl rounded hover:opacity-80 transition-opacity"
    >
      {title}
    </Link>
  );
};
export default NavLink;
