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
  customTextClasses?: string;
  children: React.ReactNode;
};

export type CardProps = {
  title: string;
  desc: string;
  imgSrc: string;
  gitURL: string;
};
