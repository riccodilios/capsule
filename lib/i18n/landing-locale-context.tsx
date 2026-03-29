"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "capsule-landing-locale";

type LandingLocaleContextValue = {
  landingLocale: Locale;
  setLandingLocale: (l: Locale) => void;
};

const LandingLocaleContext =
  createContext<LandingLocaleContextValue | null>(null);

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [landingLocale, setLandingLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "ar" || v === "en") setLandingLocaleState(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setLandingLocale = useCallback((l: Locale) => {
    setLandingLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ landingLocale, setLandingLocale }),
    [landingLocale, setLandingLocale],
  );

  return (
    <LandingLocaleContext.Provider value={value}>
      {children}
    </LandingLocaleContext.Provider>
  );
}

export function useLandingLocale(): LandingLocaleContextValue {
  const ctx = useContext(LandingLocaleContext);
  if (!ctx) {
    throw new Error(
      "useLandingLocale must be used within LandingLocaleProvider",
    );
  }
  return ctx;
}
