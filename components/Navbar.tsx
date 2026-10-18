"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import { NavLink, MenuOverlay, ThemeSelector } from ".";
import { navLinks } from "@/data";

const Navbar = () => {
  const [navOpen, setNavOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    nav.current?.querySelector<HTMLAnchorElement>("#mobile-navigation a")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        setNavOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [navOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const moveHiddenFocus = (element: Element | null) => {
      if (desktop.matches) {
        if (element === toggle.current || element?.closest("#mobile-navigation")) {
          nav.current?.querySelector<HTMLAnchorElement>(".menu a")?.focus();
        }
      } else if (element?.closest(".menu")) {
        toggle.current?.focus();
      }
    };
    // CSS can blur a newly hidden link before matchMedia's change notification.
    // In that order activeElement is already BODY; focusout retains the source.
    const focusOut = (event: FocusEvent) => {
      if (!event.relatedTarget && event.target instanceof Element) {
        moveHiddenFocus(event.target);
      }
    };
    const closeOnResize = () => {
      moveHiddenFocus(document.activeElement);
      if (desktop.matches) setNavOpen(false);
    };
    const navigation = nav.current;
    navigation?.addEventListener("focusout", focusOut);
    desktop.addEventListener("change", closeOnResize);
    return () => {
      navigation?.removeEventListener("focusout", focusOut);
      desktop.removeEventListener("change", closeOnResize);
    };
  }, []);

  return (
    <nav ref={nav} aria-label="Main navigation" className="bg-base-100 border-b border-base-content/10 sticky top-0 z-50 py-1">
      <div className="flex items-center justify-between mx-auto px-7">
        <div className="flex gap-5 sm:gap-8">
          <Link
            href="/"
            aria-label="Jin home"
            className="text-3xl md:text-5xl font-semibold flex items-center gap-2"
          >
            <div className="solid outline-1">
              <CommandLineIcon className="size-9" />
            </div>
            <span className="w-1 h-7 bg-current"></span>
            <span className="readable-gradient logo-gradient tracking-wide text-3xl text-primary font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              JIN
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSelector />
          <div className="mobile-menu block md:hidden">
            <button
              ref={toggle}
              type="button"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navOpen}
              aria-controls="mobile-navigation"
              onClick={() => setNavOpen(!navOpen)}
              className="px-4 py-2 rounded border hover:opacity-80 transition-opacity"
            >
              {navOpen ? <XMarkIcon className="size-5" /> : <Bars3Icon className="size-5" />}
            </button>
          </div>
          <div className="menu hidden md:block md:w-auto">
            <ul className="flex p-4 md:p-0 md:flex-row md:space-x-8">
              {navLinks.map((link) => (
                <li key={link.title}>
                  <NavLink href={link.path} title={link.title} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {navOpen && <MenuOverlay links={navLinks} onNavigate={(href) => {
        setNavOpen(false);
        document.getElementById(href.slice(1))?.focus({ preventScroll: true });
      }} />}
    </nav>
  );
};
export default Navbar;
