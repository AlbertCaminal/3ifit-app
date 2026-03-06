"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const STORAGE_KEY = "3ifit-theme";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  darkModeUnlocked: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDarkModeUnlocked: (unlocked: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [darkModeUnlocked, setDarkModeUnlockedState] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setThemeState("dark");
    }
  }, []);

  const setDarkModeUnlocked = useCallback((unlocked: boolean) => {
    setDarkModeUnlockedState(unlocked);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      if (next === "dark" && !darkModeUnlocked) return;
      setThemeState(next);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem(STORAGE_KEY, next);
      }
    },
    [darkModeUnlocked]
  );

  const toggleTheme = useCallback(() => {
    if (!darkModeUnlocked) return;
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, [darkModeUnlocked]);

  useEffect(() => {
    if (!mounted) return;
    if (!darkModeUnlocked && theme === "dark") {
      setThemeState("light");
      document.documentElement.classList.remove("dark");
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, "light");
      }
      return;
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [mounted, theme, darkModeUnlocked]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        darkModeUnlocked,
        setTheme,
        toggleTheme,
        setDarkModeUnlocked,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
