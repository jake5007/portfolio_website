import { PaletteIcon } from "lucide-react";
import { themes } from "@/data";
import { useThemeStore } from "@/store/useThemeStore";

const ThemeSelector = () => {
  const { theme: currTheme, setTheme: setCurrTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle">
        <PaletteIcon className="size-5" />
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg 
        rounded-2xl w-56 border border-base-content/10"
      >
        {themes.map((theme) => (
          <button
            key={theme.name}
            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
            ${
              currTheme === theme.name
                ? "bg-primary/10 text-primary"
                : "hover:bg-base-content/5"
            }
            `}
            onClick={() => setCurrTheme(theme.name)}
          >
            <PaletteIcon className="size-4" />
            <span className="text-sm font-medium">{theme.label}</span>
            <div className="ml-auto flex gap-1">
              {theme.colors.map((color, idx) => (
                <span
                  key={idx}
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default ThemeSelector;
