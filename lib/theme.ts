import { themes } from "@/data";

export const DEFAULT_THEME = "night";
export const THEME_STORAGE_KEY = "portfolio-theme";

export const resolveTheme = (value: unknown): string =>
  typeof value === "string" && themes.some((theme) => theme.name === value)
    ? value
    : DEFAULT_THEME;

// Runs in the head before paint. Only known theme names can become attributes.
export const themeInitializationScript = `(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "null");
    if (saved && (typeof saved.version !== "number" || saved.version === 0)) {
      const theme = saved.state && saved.state.theme;
      if (${JSON.stringify(themes.map((theme) => theme.name))}.includes(theme)) {
        document.documentElement.setAttribute("data-theme", theme);
      }
    }
  } catch {
    // Keep the server-rendered default when storage is unavailable or invalid.
  }
})();`;
