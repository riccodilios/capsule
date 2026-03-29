import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "capsule-glass-panel p-6 sm:p-8 lg:p-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
