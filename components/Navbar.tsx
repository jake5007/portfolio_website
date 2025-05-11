"use client";

import { useState } from "react";
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

  return (
    <nav className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50 py-1">
      <div className="flex items-center justify-between mx-auto px-7">
        <div className="flex gap-5 sm:gap-8">
          <Link
            href="/"
            className="text-3xl md:text-5xl font-semibold flex items-center gap-2"
          >
            <div className="solid outline-1">
              <CommandLineIcon className="size-9" />
            </div>
            <span className="w-1 h-7 bg-current"></span>
            <span className="tracking-wide text-3xl text-primary font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              JIN
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSelector />
          <div className="mobile-menu block md:hidden">
            {navOpen ? (
              <button
                onClick={() => setNavOpen(false)}
                className="px-4 py-2 rounded border hover:opacity-80 transition-opacity"
              >
                <XMarkIcon className="size-5" />
              </button>
            ) : (
              <button
                onClick={() => setNavOpen(true)}
                className="px-4 py-2 rounded border hover:opacity-80 transition-opacity"
              >
                <Bars3Icon className="size-5" />
              </button>
            )}
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
      {navOpen && <MenuOverlay links={navLinks} />}
    </nav>
  );
};
export default Navbar;
