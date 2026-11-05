import NavLink from "./NavLink";
import type { MenuOverlayProps } from "@/types";

const MenuOverlay = ({ links, onNavigate }: MenuOverlayProps) => {
  return (
    <ul id="mobile-navigation" className="flex md:hidden flex-col items-center">
      {links.map((link) => (
        <li key={link.title}>
          <NavLink href={link.path} title={link.title} onClick={() => onNavigate(link.path)} />
        </li>
      ))}
    </ul>
  );
};
export default MenuOverlay;
