"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocale } from "@/lib/i18n/locale-context";
import { GlassPanel } from "@/components/glass-panel";

/**
 * Sends signed-in users who have not finished onboarding to `/onboarding`.
 * Waits for Convex auth (Clerk JWT → Convex) before trusting `getStatus`.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    isLoading: convexAuthLoading,
    isAuthenticated: convexAuthenticated,
  } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const convexReady =
    isSignedIn && !convexAuthLoading && convexAuthenticated;

  const status = useQuery(
    api.onboarding.getStatus,
    convexReady ? {} : "skip",
  );

  const onOnboardingRoute =
    pathname === "/onboarding" || pathname?.startsWith("/onboarding/");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (convexAuthLoading || !convexAuthenticated) return;
    if (status === undefined) return;
    if (status === null) return;
    if (status.completed) return;
    const onOnboarding =
      pathname === "/onboarding" || pathname?.startsWith("/onboarding/");
    if (onOnboarding) return;
    router.replace("/onboarding");
  }, [
    isLoaded,
    isSignedIn,
    convexAuthLoading,
    convexAuthenticated,
    status,
    pathname,
    router,
  ]);

  if (!isLoaded) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-capsule-text-muted"
        role="status"
      >
        {t.common.loading}
      </div>
    );
  }

  if (!isSignedIn) {
    return <>{children}</>;
  }

  if (convexAuthLoading) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-capsule-text-muted"
        role="status"
      >
        {t.common.loading}
      </div>
    );
  }

  if (!convexAuthenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <GlassPanel className="max-w-md border-[color:rgba(201,138,138,0.35)] bg-white/60">
          <p className="text-center text-sm leading-relaxed text-capsule-text">
            {t.common.authBackendError}
          </p>
          <p className="mt-4 text-center text-xs text-capsule-text-muted">
            <a
              href="https://docs.convex.dev/auth/clerk"
              className="font-medium text-capsule-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              docs.convex.dev/auth/clerk
            </a>
          </p>
        </GlassPanel>
      </div>
    );
  }

  if (status === undefined) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-capsule-text-muted"
        role="status"
      >
        {t.common.loading}
      </div>
    );
  }

  if (status === null) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-capsule-text-muted"
        role="status"
      >
        {t.common.loading}
      </div>
    );
  }

  if (status && !status.completed && !onOnboardingRoute) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-capsule-text-muted"
        role="status"
      >
        {t.common.loading}
      </div>
    );
  }

  return <>{children}</>;
}
