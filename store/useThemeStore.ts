import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeStore = {
  theme: string;
  setTheme: (theme: string) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "night", // default theme
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "portfolio-theme", // localStorage key
    }
  )
);
