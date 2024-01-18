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
  liveURL: string;
  gitURL: string;
};

export type CarouselWithDescProps = {
  id: number;
  title: string;
  desc: string;
  image: string[];
  isInView: boolean;
};

export type InputContainerProps = {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  textarea?: boolean;
};

export type ContactFormData = {
  email: string;
  subject: string;
  message: string;
};
