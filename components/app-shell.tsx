"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { capsuleClerkAppearance } from "@/lib/clerk-appearance";
import { useLocale } from "@/lib/i18n/locale-context";
import { AppMobileTabBar } from "@/components/app-mobile-tab-bar";
import { CapsuleLogo } from "@/components/capsule-logo";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/medications", key: "medications" as const },
  { href: "/settings", key: "settings" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, dir } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="capsule-header-shell sticky top-0 z-50">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-8 sm:py-4">
          <Link
            href="/dashboard"
            className="min-w-0 max-w-[min(200px,55vw)] justify-self-start self-center outline-offset-4 focus-visible:rounded-md sm:max-w-[min(200px,42vw)]"
            aria-label={t.meta.name}
          >
            <CapsuleLogo
              priority
              className="h-9 max-h-9 w-auto max-w-full sm:h-10 sm:max-h-10"
            />
          </Link>
          <nav
            className="hidden min-w-0 w-full max-w-full flex-nowrap items-center justify-center gap-x-2 self-center sm:flex"
            dir={dir}
          >
            {nav.map(({ href, key }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "capsule-nav-link whitespace-nowrap px-4 py-2 text-sm",
                    active ? "capsule-nav-link--active" : "capsule-nav-link--inactive",
                  )}
                >
                  {t.nav[key]}
                </Link>
              );
            })}
          </nav>
          <div className="justify-self-end self-center sm:col-start-3">
            <UserButton
              appearance={{
                ...capsuleClerkAppearance,
                elements: {
                  ...capsuleClerkAppearance.elements,
                  avatarBox:
                    "h-9 w-9 ring-2 ring-[var(--capsule-border)] shadow-sm",
                },
              }}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-10 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:px-8 sm:pb-12 sm:pt-12">
        {children}
      </main>
      <footer
        className="mx-auto w-full max-w-5xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-6 text-center sm:px-8 sm:pb-8 sm:pt-8"
        dir={dir}
      >
        <p className="text-xs text-capsule-text-muted">{t.meta.footerCredit}</p>
      </footer>
      <AppMobileTabBar
        pathname={pathname}
        dir={dir}
        labels={{
          dashboard: t.nav.dashboard,
          medications: t.nav.medications,
          settings: t.nav.settings,
        }}
      />
    </div>
  );
}
