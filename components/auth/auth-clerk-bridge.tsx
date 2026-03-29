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
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { usePathname } from "next/navigation";
import { capsuleClerkAppearance } from "@/lib/clerk-appearance";
import { getAuthFlowLocalization } from "@/lib/clerk-auth-localization";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { LandingLocaleProvider } from "@/lib/i18n/landing-locale-context";
import { DocumentLocale } from "@/components/document-locale";
import { ClerkDevModeCleanup } from "@/components/auth/clerk-dev-mode-cleanup";
import { BootstrapUser } from "@/components/bootstrap-user";

export type AuthPageLang = "en" | "ar";

type AuthPageLocaleContextValue = {
  authPageLang: AuthPageLang;
  setAuthPageLang: (lang: AuthPageLang) => void;
};

const AuthPageLocaleContext = createContext<AuthPageLocaleContextValue | null>(
  null,
);

export function useAuthPageLocale() {
  const ctx = useContext(AuthPageLocaleContext);
  if (!ctx) {
    throw new Error("useAuthPageLocale must be used within AuthClerkBridge");
  }
  return ctx;
}

function AuthClerkInner({
  children,
  convex,
}: {
  children: ReactNode;
  convex: ConvexReactClient;
}) {
  const pathname = usePathname();
  const [authPageLang, setAuthPageLang] = useState<AuthPageLang>("ar");

  useEffect(() => {
    const onAuth =
      pathname?.startsWith("/sign-up") || pathname?.startsWith("/sign-in");
    if (!onAuth) {
      setAuthPageLang("ar");
    }
  }, [pathname]);

  const localization = useMemo(
    () => getAuthFlowLocalization(authPageLang),
    [authPageLang],
  );

  const setAuthPageLangStable = useCallback((lang: AuthPageLang) => {
    setAuthPageLang(lang);
  }, []);

  const localeValue = useMemo(
    () => ({
      authPageLang,
      setAuthPageLang: setAuthPageLangStable,
    }),
    [authPageLang, setAuthPageLangStable],
  );

  return (
    <AuthPageLocaleContext.Provider value={localeValue}>
      <ClerkProvider
        localization={localization}
        appearance={capsuleClerkAppearance}
        afterSignOutUrl="/"
        signUpUrl="/sign-up"
        signInUrl="/sign-in"
        unsafe_disableDevelopmentModeConsoleWarning
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <LandingLocaleProvider>
            <LocaleProvider>
              <DocumentLocale />
              <ClerkDevModeCleanup />
              <BootstrapUser />
              {children}
            </LocaleProvider>
          </LandingLocaleProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </AuthPageLocaleContext.Provider>
  );
}

export function AuthClerkBridge({
  children,
  convex,
}: {
  children: ReactNode;
  convex: ConvexReactClient;
}) {
  return <AuthClerkInner convex={convex}>{children}</AuthClerkInner>;
}
