"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/lib/i18n/dictionaries";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
    useConvexAuth();
  const settings = useQuery(
    api.userSettings.get,
    isSignedIn && !convexAuthLoading && convexAuthenticated ? {} : "skip",
  );

  const locale: Locale = settings?.locale === "en" ? "en" : "ar";
  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const t = useMemo(() => dictionaries[locale], [locale]);

  const value = useMemo(
    () => ({ locale, dir, t }),
    [locale, dir, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "ar" as Locale,
      dir: "rtl" as const,
      t: dictionaries.ar,
    };
  }
  return ctx;
}
