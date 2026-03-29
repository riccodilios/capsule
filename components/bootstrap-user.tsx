"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Ensures `userSettings` exists in Convex after sign-in (idempotent). */
export function BootstrapUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
    useConvexAuth();
  const ensure = useMutation(api.userSettings.ensure);
  const ran = useRef(false);

  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      convexAuthLoading ||
      !convexAuthenticated ||
      ran.current
    ) {
      return;
    }
    ran.current = true;
    void ensure().catch(() => {
      ran.current = false;
    });
  }, [
    isLoaded,
    isSignedIn,
    convexAuthLoading,
    convexAuthenticated,
    ensure,
  ]);

  return null;
}
