import NavLink from "./NavLink";

const MenuOverlay = ({
  links,
}: {
  links: { title: string; path: string }[];
}) => {
  return (
    <ul className="flex flex-col items-center">
      {links.map((link) => (
        <li key={link.title}>
          <NavLink href={link.path} title={link.title} />
        </li>
      ))}
    </ul>
  );
};
export default MenuOverlay;
