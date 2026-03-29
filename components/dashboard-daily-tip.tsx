"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { getDailyTip } from "@/lib/daily-tips";
import { cn } from "@/lib/cn";

const STORAGE_PREFIX = "capsule:daily-tip-dismissed:";

export function DashboardDailyTip({ dayISO }: { dayISO: string }) {
  const { t, locale, dir } = useLocale();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(
        typeof window !== "undefined" &&
          window.localStorage.getItem(STORAGE_PREFIX + dayISO) === "1",
      );
    } finally {
      setReady(true);
    }
  }, [dayISO]);

  if (!ready || dismissed) return null;

  const tip = getDailyTip(dayISO);
  const text = locale === "ar" ? tip.ar : tip.en;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + dayISO, "1");
    } catch {
      /* ignore quota */
    }
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color:rgba(110,135,141,0.35)]",
        "bg-gradient-to-br from-[rgba(255,255,255,0.92)] to-[rgba(230,242,245,0.55)]",
        "px-4 py-3 pr-11 shadow-[0_8px_30px_rgba(45,74,82,0.08)] sm:px-5 sm:py-4",
      )}
      dir={dir}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[color:rgba(110,135,141,0.12)]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--capsule-primary)]">
          {t.dashboard.dailyTipBadge}
        </span>
        <p
          className={cn(
            "text-sm leading-relaxed text-capsule-text",
            locale === "ar" && "font-arabic",
          )}
        >
          {text}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          "absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg",
          "text-capsule-text-muted transition-colors hover:bg-white/60 hover:text-capsule-text",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--capsule-primary)]",
        )}
        aria-label={t.dashboard.dailyTipDismiss}
      >
        <span className="text-lg leading-none" aria-hidden>
          ×
        </span>
      </button>
    </div>
  );
}
