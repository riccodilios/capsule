"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1.25" />
      <rect x="14" y="3" width="7" height="7" rx="1.25" />
      <rect x="3" y="14" width="7" height="7" rx="1.25" />
      <rect x="14" y="14" width="7" height="7" rx="1.25" />
    </svg>
  );
}

function IconMedications({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="9" width="12" height="6" rx="3" ry="3" />
      <line x1="12" y1="9" x2="12" y2="15" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

const icons = {
  dashboard: IconDashboard,
  medications: IconMedications,
  settings: IconSettings,
} as const;

type NavKey = keyof typeof icons;

export function AppMobileTabBar({
  pathname,
  labels,
  dir,
}: {
  pathname: string | null;
  labels: Record<NavKey, string>;
  dir: "ltr" | "rtl";
}) {
  const items: { href: string; key: NavKey }[] = [
    { href: "/dashboard", key: "dashboard" },
    { href: "/medications", key: "medications" },
    { href: "/settings", key: "settings" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[color:rgba(110,135,141,0.35)] bg-[rgba(255,255,255,0.92)] shadow-[0_-4px_24px_rgba(93,153,166,0.08)] backdrop-blur-xl sm:hidden"
      dir={dir}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map(({ href, key }) => {
          const active =
            pathname === href || pathname?.startsWith(`${href}/`) === true;
          const Icon = icons[key];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-2 py-2 transition-colors",
                active
                  ? "text-capsule-primary"
                  : "text-capsule-text-muted hover:text-capsule-text",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-6 w-6 shrink-0",
                  active && "drop-shadow-[0_0_0_0.5px_rgba(93,153,166,0.35)]",
                )}
              />
              <span className="max-w-full truncate text-center text-[10px] font-medium leading-tight">
                {labels[key]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
