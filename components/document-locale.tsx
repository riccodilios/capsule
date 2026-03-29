"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useAuthPageLocale } from "@/components/auth/auth-clerk-bridge";
import { useLocale } from "@/lib/i18n/locale-context";
import { useLandingLocale } from "@/lib/i18n/landing-locale-context";

/**
 * Syncs `<html lang dir>` for RTL and Tajawal:
 * - Signed in: Convex `userSettings.locale`
 * - Signed out on `/`: landing EN/AR toggle (localStorage)
 * - Signed out on sign-in/sign-up: auth flow language pill
 * - Otherwise: Arabic / RTL (default)
 */
export function DocumentLocale() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const { locale, dir } = useLocale();
  const { authPageLang } = useAuthPageLocale();
  const { landingLocale } = useLandingLocale();

  useEffect(() => {
    if (!isLoaded) return;

    const onLanding =
      pathname === "/" || pathname === "" || pathname === "/about";
    const onAuthFlow =
      pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

    if (isSignedIn) {
      document.documentElement.lang = locale === "ar" ? "ar" : "en";
      document.documentElement.dir = dir;
      return;
    }

    if (onLanding) {
      const ar = landingLocale === "ar";
      document.documentElement.lang = ar ? "ar" : "en";
      document.documentElement.dir = ar ? "rtl" : "ltr";
      return;
    }

    if (onAuthFlow) {
      const ar = authPageLang === "ar";
      document.documentElement.lang = ar ? "ar" : "en";
      document.documentElement.dir = ar ? "rtl" : "ltr";
      return;
    }

    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, [isLoaded, isSignedIn, locale, dir, pathname, authPageLang, landingLocale]);

  return null;
}
