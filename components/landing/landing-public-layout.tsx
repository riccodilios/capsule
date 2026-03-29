"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/locale-context";
import { useLandingLocale } from "@/lib/i18n/landing-locale-context";
import { CapsuleLogo } from "@/components/capsule-logo";
import { cn } from "@/lib/cn";

export function LandingPublicLayout({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const ctx = useLocale();
  const { landingLocale, setLandingLocale } = useLandingLocale();
  const updateLocale = useMutation(api.userSettings.updateLocale);

  const t = isSignedIn ? ctx.t : dictionaries[landingLocale];
  const dir = isSignedIn ? ctx.dir : landingLocale === "ar" ? "rtl" : "ltr";
  const uiLocale = isSignedIn ? ctx.locale : landingLocale;

  function setLang(next: Locale) {
    if (isSignedIn) void updateLocale({ locale: next });
    else setLandingLocale(next);
  }

  return (
    <div className="flex min-h-screen flex-col" dir={dir}>
      <header className="border-b border-[color:rgba(110,135,141,0.18)] bg-[rgba(255,255,255,0.35)] backdrop-blur-md">
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2 px-4 py-2 sm:gap-x-3 sm:px-6 sm:py-2.5">
          <Link
            href="/"
            className="inline-flex min-w-0 max-w-[min(260px,58vw)] items-center justify-self-start"
          >
            <CapsuleLogo
              priority
              className="h-9 max-h-9 w-auto max-w-full sm:h-10 sm:max-h-10"
              alt={t.meta.name}
            />
          </Link>

          <Link
            href="/about"
            className={cn(
              "justify-self-center text-center text-sm font-medium text-capsule-primary underline-offset-4 hover:underline",
              uiLocale === "ar" && "font-arabic",
            )}
          >
            {t.nav.about}
          </Link>

          <div className="flex min-w-0 flex-wrap items-center justify-end justify-self-end gap-2 sm:gap-3">
            <span className="hidden text-xs font-medium text-capsule-text-muted sm:inline">
              {t.settings.language}
            </span>
            <div
              dir="ltr"
              className="relative inline-flex h-9 items-stretch rounded-full border border-[color:rgba(110,135,141,0.32)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,252,253,0.55))] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_18px_rgba(93,153,166,0.12)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_22px_rgba(93,153,166,0.16)]"
              role="group"
              aria-label={t.settings.language}
            >
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-b from-white to-[var(--capsule-primary-soft)] shadow-[0_2px_10px_rgba(93,153,166,0.16),inset_0_0_0_1px_rgba(93,153,166,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.15,0.64,1)] will-change-transform motion-reduce:transition-none",
                  uiLocale === "ar" && "translate-x-full",
                )}
              />
              <button
                type="button"
                className={cn(
                  "relative z-10 min-w-[4.25rem] rounded-full px-3 py-1.5 text-sm font-medium transition-[color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100",
                  uiLocale === "en"
                    ? "text-capsule-text"
                    : "text-capsule-text-muted hover:text-capsule-text",
                )}
                onClick={() => setLang("en")}
              >
                {t.settings.english}
              </button>
              <button
                type="button"
                className={cn(
                  "relative z-10 min-w-[4.25rem] rounded-full px-3 py-1.5 text-sm font-medium transition-[color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100",
                  "font-arabic",
                  uiLocale === "ar"
                    ? "text-capsule-text"
                    : "text-capsule-text-muted hover:text-capsule-text",
                )}
                onClick={() => setLang("ar")}
              >
                {t.settings.arabic}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-auto border-t border-[color:rgba(110,135,141,0.15)] py-6">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p
            className={cn(
              "text-xs text-capsule-text-muted",
              uiLocale === "ar" && "font-arabic",
            )}
          >
            {t.meta.footerCredit}
          </p>
        </div>
      </footer>
    </div>
  );
}
