"use client";

import { useThemeStore } from "@/store/useThemeStore";
import { useHasHydrated } from "@/hook/useHasHydrated";
import { useEffect } from "react";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useThemeStore((state) => state.theme);
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (hasHydrated) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-dots loading-xl" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ThemeProvider;
