import NavLink from "./NavLink";
import type { MenuOverlayProps } from "@/types";

const MenuOverlay = ({ links }: MenuOverlayProps) => {
  return (
    <ul className="flex md:hidden flex-col items-center">
      {links.map((link) => (
        <li key={link.title}>
          <NavLink href={link.path} title={link.title} />
        </li>
      ))}
    </ul>
  );
};
export default MenuOverlay;
