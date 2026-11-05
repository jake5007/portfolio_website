import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

// A matching server snapshot keeps the first hydration render deterministic.
export const usePrefersReducedMotion = () => useSyncExternalStore(
  subscribe, () => window.matchMedia(query).matches, () => false
);
