"use client";

import { CapsuleLogo } from "@/components/capsule-logo";
import { AuthLocaleToggle } from "@/components/auth/auth-locale-toggle";
import type { AuthLang } from "@/components/auth/auth-locale-toggle";

type Props = {
  title: string;
  trust: string;
  lang: AuthLang;
  onLangChange: (lang: AuthLang) => void;
};

/**
 * Centered logo, language toggle, title, and trust line for sign-in / sign-up.
 */
export function AuthMarketingHeader({
  title,
  trust,
  lang,
  onLangChange,
}: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <CapsuleLogo
        className="h-11 max-w-[min(100%,260px)] object-contain object-center sm:h-12"
        priority
        alt="Capsule"
      />
      <AuthLocaleToggle value={lang} onChange={onLangChange} />
      <div className="mx-auto max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-capsule-text sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-capsule-text-muted">{trust}</p>
      </div>
    </div>
  );
}
