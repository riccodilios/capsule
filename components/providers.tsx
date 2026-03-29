"use client";

import { ConvexReactClient } from "convex/react";
import { AuthClerkBridge } from "@/components/auth/auth-clerk-bridge";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convex) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-capsule-bg p-6 text-center text-sm text-capsule-text-muted">
        Set NEXT_PUBLIC_CONVEX_URL in .env.local
      </div>
    );
  }
  return <AuthClerkBridge convex={convex}>{children}</AuthClerkBridge>;
}
