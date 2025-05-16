"use client";

import { useThemeStore } from "@/store/useThemeStore";
import { useHasHydrated } from "@/hook/useHasHydrated";
import { useEffect, useState } from "react";
import { ChevronsUpIcon } from "lucide-react";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useThemeStore((state) => state.theme);
  const hasHydrated = useHasHydrated();

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, hasHydrated]);

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

  if (!hasHydrated) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-dots loading-xl" />
      </div>
    );
  }

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
