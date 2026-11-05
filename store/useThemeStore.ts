import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME, resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

type ThemeStore = {
  theme: string;
  setTheme: (theme: string) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme: resolveTheme(theme) }),
    }),
    {
      name: THEME_STORAGE_KEY,
      skipHydration: true,
      partialize: (state) => ({ theme: state.theme }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        theme: resolveTheme(
          typeof persistedState === "object" &&
            persistedState !== null &&
            "theme" in persistedState
            ? persistedState.theme
            : undefined
        ),
      }),
    }
  )
);
