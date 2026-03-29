"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/locale-context";
import { useLandingLocale } from "@/lib/i18n/landing-locale-context";
import { GlassPanel } from "@/components/glass-panel";
import { LandingPublicLayout } from "@/components/landing/landing-public-layout";
import { cn } from "@/lib/cn";

const VALUE_KEYS = [
  ["value1Title", "value1Body"],
  ["value2Title", "value2Body"],
  ["value3Title", "value3Body"],
] as const;

export function LandingHome() {
  const { isSignedIn } = useAuth();
  const ctx = useLocale();
  const { landingLocale } = useLandingLocale();

  const t = isSignedIn ? ctx.t : dictionaries[landingLocale];
  const uiLocale = isSignedIn ? ctx.locale : landingLocale;

  const primaryHref = isSignedIn ? "/dashboard" : "/sign-up";
  const primaryLabel = isSignedIn ? t.landing.openDashboard : t.landing.cta;

  return (
    <LandingPublicLayout>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="space-y-14">
          <section className="space-y-6 text-center sm:space-y-8">
            <h1
              className={cn(
                "text-balance text-4xl font-semibold tracking-tight text-capsule-text sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {t.landing.title}
            </h1>
            <p
              className={cn(
                "mx-auto max-w-2xl text-pretty text-lg font-normal leading-relaxed text-capsule-text-muted sm:text-xl",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {t.landing.subtitle}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={primaryHref}
                className="capsule-btn-primary min-h-12 w-full max-w-xs px-8 text-center text-base sm:w-auto"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/about"
                className="capsule-btn-secondary min-h-12 w-full max-w-xs px-8 text-center text-base sm:w-auto"
              >
                {t.landing.learnMore}
              </Link>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {VALUE_KEYS.map(([titleKey, bodyKey], i) => (
              <GlassPanel
                key={titleKey}
                className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-5 sm:p-6"
              >
                <div className="flex gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--capsule-primary-soft)] text-sm font-semibold tabular-nums text-capsule-primary"
                    aria-hidden
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 space-y-2 text-start">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-snug text-capsule-text sm:text-[0.9375rem]",
                        uiLocale === "ar" && "font-arabic",
                      )}
                    >
                      {t.landing[titleKey]}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-normal leading-relaxed text-capsule-text-muted sm:text-[0.9375rem]",
                        uiLocale === "ar" && "font-arabic",
                      )}
                    >
                      {t.landing[bodyKey]}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </section>

          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-6 sm:p-8">
            <h2
              className={cn(
                "capsule-section-title mb-4 text-center text-base",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {t.landing.builtTitle}
            </h2>
            <p
              className={cn(
                "whitespace-pre-line text-center text-sm leading-relaxed text-capsule-text-muted sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {t.landing.builtBody}
            </p>
            <ul
              className={cn(
                "mx-auto mt-6 max-w-md list-disc space-y-2 ps-5 text-start text-sm leading-relaxed text-capsule-text sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              <li>{t.landing.builtBullet1}</li>
              <li>{t.landing.builtBullet2}</li>
              <li>{t.landing.builtBullet3}</li>
            </ul>
          </GlassPanel>

          <p
            className={cn(
              "mx-auto max-w-2xl text-center text-sm font-medium text-capsule-text sm:text-base",
              uiLocale === "ar" && "font-arabic",
            )}
          >
            {t.landing.positioningLine}
          </p>

          <p
            className={cn(
              "mx-auto max-w-xl text-center text-sm leading-relaxed text-capsule-text-muted",
              uiLocale === "ar" && "font-arabic",
            )}
          >
            {t.landing.trustLine}
          </p>

          <GlassPanel className="mx-auto max-w-2xl border-[color:rgba(110,135,141,0.38)] bg-white/55">
            <p
              className={cn(
                "text-center text-base font-medium text-capsule-text sm:text-lg",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {t.landing.finalCtaHeading}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="capsule-btn-primary min-h-12 px-8 text-center text-base"
              >
                {isSignedIn ? t.landing.openDashboard : t.landing.finalCtaButton}
              </Link>
            </div>
          </GlassPanel>
        </div>
      </main>
    </LandingPublicLayout>
  );
}
