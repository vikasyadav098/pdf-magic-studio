import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const KEY = "pdf-studio-theme";

function getInitial(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const t = getInitial();
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const apply = (t: ThemeMode) => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem(KEY, t);
    } catch {}
  };

  const toggle = () => apply(theme === "dark" ? "light" : "dark");

  return { theme, setTheme: apply, toggle };
}
