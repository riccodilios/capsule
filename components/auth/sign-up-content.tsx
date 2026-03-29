"use client";

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";
import { useAuthPageLocale } from "@/components/auth/auth-clerk-bridge";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthMarketingHeader } from "@/components/auth/auth-marketing-header";
import { capsuleClerkAppearance } from "@/lib/clerk-appearance";

const copy = {
  en: {
    title: "Create your Capsule",
    trust: "Your medical data is private and secure",
  },
  ar: {
    title: "أنشئ حسابك في كابسول",
    trust: "بياناتك الطبية خاصة وآمنة",
  },
} as const;

type SignUpContentProps = {
  initialLang: "en" | "ar";
};

export function SignUpContent({ initialLang }: SignUpContentProps) {
  const { authPageLang, setAuthPageLang } = useAuthPageLocale();

  useEffect(() => {
    setAuthPageLang(initialLang);
  }, [initialLang, setAuthPageLang]);

  const lang = authPageLang;
  const t = copy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const htmlLang = lang === "ar" ? "ar" : "en";

  return (
    <AuthPageShell dir={dir} lang={htmlLang}>
      <AuthBackLink lang={lang} />
      <AuthMarketingHeader
        title={t.title}
        trust={t.trust}
        lang={lang}
        onLangChange={setAuthPageLang}
      />

      <div className="w-full">
        <SignUp
          forceRedirectUrl={
            lang === "ar" ? "/onboarding?locale=ar" : "/onboarding"
          }
          signInUrl="/sign-in"
          appearance={{
            ...capsuleClerkAppearance,
            elements: {
              ...capsuleClerkAppearance.elements,
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </div>
    </AuthPageShell>
  );
}
