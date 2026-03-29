"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/locale-context";
import { useLandingLocale } from "@/lib/i18n/landing-locale-context";
import { GlassPanel } from "@/components/glass-panel";
import { LandingPublicLayout } from "@/components/landing/landing-public-layout";
import { cn } from "@/lib/cn";

export function AboutPage() {
  const { isSignedIn } = useAuth();
  const ctx = useLocale();
  const { landingLocale } = useLandingLocale();

  const t = isSignedIn ? ctx.t : dictionaries[landingLocale];
  const uiLocale = isSignedIn ? ctx.locale : landingLocale;
  const a = t.about;

  return (
    <LandingPublicLayout>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <div className="space-y-12 sm:space-y-14">
          <header className="space-y-4 text-center sm:space-y-5">
            <h1
              className={cn(
                "text-balance text-3xl font-semibold tracking-tight text-capsule-text sm:text-4xl",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.heroTitle}
            </h1>
            <p
              className={cn(
                "mx-auto max-w-2xl text-pretty text-base leading-relaxed text-capsule-text-muted sm:text-lg",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.heroSubtitle}
            </p>
          </header>

          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-6 sm:p-8">
            <h2
              className={cn(
                "capsule-section-title mb-4 text-base",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.labelProblem}
            </h2>
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-capsule-text-muted sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.problemBody}
            </p>
          </GlassPanel>

          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-6 sm:p-8">
            <h2
              className={cn(
                "capsule-section-title mb-4 text-base",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.labelApproach}
            </h2>
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-capsule-text-muted sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.approachIntro}
            </p>
            <ul
              className={cn(
                "mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-capsule-text sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              <li>{a.approachBullet1}</li>
              <li>{a.approachBullet2}</li>
              <li>{a.approachBullet3}</li>
            </ul>
          </GlassPanel>

          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-6 sm:p-8">
            <h2
              className={cn(
                "capsule-section-title mb-4 text-base",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.labelPrinciples}
            </h2>
            <ul
              className={cn(
                "list-none space-y-3 text-sm leading-relaxed text-capsule-text sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              <li>{a.principle1}</li>
              <li>{a.principle2}</li>
              <li>{a.principle3}</li>
            </ul>
          </GlassPanel>

          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 p-6 sm:p-8">
            <h2
              className={cn(
                "capsule-section-title mb-4 text-base",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              {a.labelWhat}
            </h2>
            <div
              className={cn(
                "space-y-3 text-sm leading-relaxed text-capsule-text-muted sm:text-[0.9375rem]",
                uiLocale === "ar" && "font-arabic",
              )}
            >
              <p>{a.whatIntro}</p>
              <p>{a.whatOutro}</p>
            </div>
          </GlassPanel>

          <div
            className={cn(
              "space-y-2 text-center text-sm font-medium leading-relaxed text-capsule-text sm:text-base",
              uiLocale === "ar" && "font-arabic",
            )}
          >
            <p>{a.final1}</p>
            <p>{a.final2}</p>
            <p>{a.final3}</p>
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className="capsule-btn-primary min-h-12 px-8 text-center text-base"
            >
              {isSignedIn ? t.landing.openDashboard : a.cta}
            </Link>
          </div>
        </div>
      </main>
    </LandingPublicLayout>
  );
}
