"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeModeSetting = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

interface ThemeModeContextValue {
  /** The user's chosen setting: light, dark, or system */
  modeSetting: ThemeModeSetting;
  /** The resolved mode after evaluating system preference */
  resolvedMode: ResolvedThemeMode;
  /** Update the theme mode setting */
  setModeSetting: (mode: ThemeModeSetting) => void;
}

const STORAGE_KEY = "rome_theme_mode";

/** Default used during SSR and initial hydration — must be deterministic */
const SSR_DEFAULT_SETTING: ThemeModeSetting = "system";
const SSR_DEFAULT_RESOLVED: ResolvedThemeMode = "dark";

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(
  undefined
);

function getSystemPreference(): ResolvedThemeMode {
  if (typeof window === "undefined") return SSR_DEFAULT_RESOLVED;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredSetting(): ThemeModeSetting {
  if (typeof window === "undefined") return SSR_DEFAULT_SETTING;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  // Start with SSR-safe defaults to avoid hydration mismatch.
  // Real values are loaded in useEffect after mount.
  const [modeSetting, setModeSettingState] = useState<ThemeModeSetting>(SSR_DEFAULT_SETTING);
  const [systemPreference, setSystemPreference] = useState<ResolvedThemeMode>(SSR_DEFAULT_RESOLVED);
  const [mounted, setMounted] = useState(false);

  // After hydration, read the real values from localStorage / media query
  useEffect(() => {
    setModeSettingState(getStoredSetting());
    setSystemPreference(getSystemPreference());
    setMounted(true);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const setModeSetting = useCallback((mode: ThemeModeSetting) => {
    setModeSettingState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const resolvedMode: ResolvedThemeMode = useMemo(() => {
    if (modeSetting === "system") return systemPreference;
    return modeSetting;
  }, [modeSetting, systemPreference]);

  const value = useMemo(
    () => ({ modeSetting, resolvedMode, setModeSetting }),
    [modeSetting, resolvedMode, setModeSetting]
  );

  // Prevent flash: hide content until client values are loaded.
  // This is a single-frame delay (one useEffect tick) so it's imperceptible.
  if (!mounted) {
    return (
      <ThemeModeContext.Provider value={value}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ThemeModeContext.Provider>
    );
  }

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return ctx;
}
