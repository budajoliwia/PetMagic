import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";

export type AppColors = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
};

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const STORAGE_KEY = "pm_theme_mode";

const lightColors: AppColors = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#475569",
  subtle: "#64748B",
  border: "#E2E8F0",
  primary: "#16A34A",
  onPrimary: "#FFFFFF",
  danger: "#DC2626",
};

const darkColors: AppColors = {
  bg: "#020617",
  card: "#0B1220",
  text: "#E5E7EB",
  muted: "#94A3B8",
  subtle: "#64748B",
  border: "#1F2937",
  primary: "#22C55E",
  onPrimary: "#052e1d",
  danger: "#F87171",
};

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive) return;
        if (v === "light" || v === "dark" || v === "system") setMode(v);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, [loaded, mode]);

  const isDark = mode === "dark" || (mode === "system" && system === "dark");

  const value: AppTheme = useMemo(() => {
    return {
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    };
  }, [isDark, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within AppThemeProvider");
  return ctx;
}


