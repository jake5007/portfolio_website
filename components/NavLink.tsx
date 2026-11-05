import type { NavLinkProps } from "@/types";

const NavLink = ({ href, title, onClick }: NavLinkProps) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block py-2 pl-2 pr-3 sm:text-lg lg:text-xl rounded hover:opacity-80 transition-opacity"
    >
      {title}
    </a>
  );
};
export default NavLink;
