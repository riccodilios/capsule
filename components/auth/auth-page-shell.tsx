import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AuthPageShellProps = {
  children: ReactNode;
  /** `rtl` for Arabic auth flows */
  dir: "ltr" | "rtl";
  lang: string;
};

/**
 * Full-viewport light medical background + centered column for Clerk auth pages.
 */
export function AuthPageShell({ children, dir, lang }: AuthPageShellProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      dir={dir}
      lang={lang}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-capsule-bg"
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_70%_at_50%_-18%,rgba(93,153,166,0.09),transparent_52%)]",
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_100%_0%,rgba(110,135,141,0.06),transparent_48%)]"
        aria-hidden
      />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex w-full max-w-lg flex-col items-stretch gap-8">{children}</div>
      </div>
    </div>
  );
}
