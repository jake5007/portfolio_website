export type NavLinkProps = {
  href: string;
  title: string;
};

export type MenuOverlayProps = {
  links: { title: string; path: string }[];
};

export type TabBtnProps = {
  active: boolean;
  onTabChange: () => void;
  children: React.ReactNode;
};
