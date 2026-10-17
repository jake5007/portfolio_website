"use client";

import { useThemeStore } from "@/store/useThemeStore";
import { useEffect, useState } from "react";
import { ChevronsUpIcon } from "lucide-react";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let active = true;
    const applyTheme = () => {
      if (active) {
        document.documentElement.setAttribute(
          "data-theme",
          useThemeStore.getState().theme
        );
      }
    };

    const unsubscribe = useThemeStore.subscribe(applyTheme);
    // The first client render uses the same default as SSR. The head script
    // has already applied any saved theme without changing React-owned content.
    Promise.resolve(useThemeStore.persist?.rehydrate()).then(applyTheme);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [setShowScrollTop]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {children}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="btn btn-circle btn-primary fixed bottom-8 right-8 shadow-xl
          opacity-60 hover:opacity-100 transition-opacity duration-200"
        >
          <ChevronsUpIcon className="size-8" />
        </button>
      )}
    </>
  );
};

export default ThemeProvider;
