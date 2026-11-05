"use client";

import { useEffect, useRef, useState } from "react";
import { PaletteIcon } from "lucide-react";
import { themes } from "@/data";
import { useThemeStore } from "@/store/useThemeStore";

const ThemeSelector = () => {
  const { theme: currTheme, setTheme: setCurrTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className={`dropdown dropdown-end ${open ? "dropdown-open" : ""}`} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" className="btn btn-ghost btn-circle"
        aria-label="Choose theme" aria-expanded={open} aria-controls="theme-options"
        onClick={() => setOpen(!open)}>
        <PaletteIcon className="size-5" />
      </button>
      {/* Keep the panel rendered for the original opacity/scale transition.
          Inert removes closed choices from Tab/AT; inline closed styles also
          override DaisyUI's focus-within opening when Escape restores focus. */}
      <div id="theme-options" role="group" aria-label="Themes" aria-hidden={!open} inert={!open}
        style={open ? undefined : { visibility: "hidden", opacity: 0, transform: "scale(0.95)", pointerEvents: "none" }}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl w-56 border border-base-content/10">
        {themes.map((theme) => (
          <button type="button" key={theme.name} aria-pressed={currTheme === theme.name}
            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${currTheme === theme.name ? "bg-primary/10 text-primary" : "hover:bg-base-content/5"}`}
            onClick={() => setCurrTheme(theme.name)}>
            <PaletteIcon className="size-4" />
            <span className="text-sm font-medium">{theme.label}</span>
            <span aria-hidden="true" className="ml-auto flex gap-1">
              {theme.colors.map((color, idx) => (
                <span key={idx} className="size-2 rounded-full" style={{ backgroundColor: color }} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default ThemeSelector;
