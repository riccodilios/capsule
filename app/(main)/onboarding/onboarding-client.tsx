"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export function OnboardingClient({
  initialLocale,
}: {
  initialLocale: "en" | "ar";
}) {
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
    useConvexAuth();
  const updateLocale = useMutation(api.userSettings.updateLocale);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || convexAuthLoading || !convexAuthenticated) return;
    applied.current = true;
    void updateLocale({ locale: initialLocale });
  }, [
    initialLocale,
    updateLocale,
    convexAuthLoading,
    convexAuthenticated,
  ]);

  return <OnboardingWizard />;
}
