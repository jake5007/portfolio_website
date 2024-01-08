"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import NavLink from "./NavLink";
import MenuOverlay from "./MenuOverlay";
import { navLinks } from "@/data";

const Navbar = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-[#121212] bg-opacity-95 py-4">
      <div className="flex items-center justify-between mx-auto px-7">
        <Link
          href="/"
          className="text-3xl md:text-5xl text-white font-semibold"
        >
          <Image src="/images/logo.svg" alt="logo" width={85} height={45} />
        </Link>
        <div className="mobile-menu block md:hidden">
          {navOpen ? (
            <button
              onClick={() => setNavOpen(false)}
              className="px-4 py-2 rounded border border-slate-200 text-slate-200 hover:border-white hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setNavOpen(true)}
              className="px-4 py-2 rounded border border-slate-200 text-slate-200 hover:border-white hover:text-white"
            >
              <Bars3Icon className="w-5 h-5" />
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
      {navOpen && <MenuOverlay links={navLinks} />}
    </nav>
  );
};
export default Navbar;
