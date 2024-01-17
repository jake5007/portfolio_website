"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { MoonIcon, SunIcon } from "@heroicons/react/16/solid";
import { Switch } from "@headlessui/react";
import NavLink from "./NavLink";
import MenuOverlay from "./MenuOverlay";
import { navLinks } from "@/data";

const Navbar = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("theme");
    }
  }, [darkMode]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-[#121212] bg-opacity-95 py-3">
      <div className="flex items-center justify-between mx-auto px-7">
        <div className="flex gap-5 sm:gap-8">
          <Link
            href="/"
            className="text-3xl md:text-5xl text-white font-semibold"
          >
            <Image src="/images/logo.svg" alt="logo" width={85} height={45} />
          </Link>
          {/* <div className="flex items-center gap-2">
            {darkMode ? (
              <MoonIcon className="w-5 h-5 text-white" />
            ) : (
              <SunIcon className="w-5 h-5 text-white" />
            )}

            <Switch
              disabled
              checked={darkMode}
              onChange={setDarkMode}
              className={`${
                darkMode ? "bg-purple-700" : "bg-gray-400"
              } relative inline-flex h-6 w-11 items-center rounded-full`}
            >
              <span className="sr-only">Enable darkmode</span>
              <span
                className={`${
                  darkMode ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </Switch>
          </div> */}
        </div>

        <div className="mobile-menu block md:hidden">
          {navOpen ? (
            <button
              onClick={() => setNavOpen(false)}
              className="px-4 py-2 rounded border border-slate-400 text-slate-200 hover:border-white hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setNavOpen(true)}
              className="px-4 py-2 rounded border border-slate-400 text-slate-200 hover:border-white hover:text-white"
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
