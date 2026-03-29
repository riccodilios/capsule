"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/cn";

export function AdherenceRing({
  percent,
  total,
}: {
  percent: number;
  /** Past-due doses counted for today’s ring (0 → no arc). */
  total: number;
}) {
  const { t, dir } = useLocale();
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div
      className="flex flex-col items-center gap-3"
      dir={dir}
    >
      <div className="relative h-[132px] w-[132px]">
        <svg
          className="-rotate-90 transform"
          width="132"
          height="132"
          viewBox="0 0 132 132"
          aria-hidden
        >
          <circle
            cx="66"
            cy="66"
            r={r}
            fill="none"
            stroke="rgba(110, 135, 141, 0.22)"
            strokeWidth="10"
          />
          <circle
            cx="66"
            cy="66"
            r={r}
            fill="none"
            stroke="var(--capsule-primary)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold tabular-nums text-capsule-text">
            {total === 0 ? "—" : `${percent}%`}
          </span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-capsule-text-muted">
            {t.dashboard.adherenceHeading}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "primary";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[var(--radius-md)] border px-2 py-2.5 text-center backdrop-blur-sm sm:px-3",
        "border-[color:rgba(110,135,141,0.35)] bg-white/45 shadow-sm",
        tone === "success" && "shadow-[inset_0_0_0_1px_rgba(122,171,140,0.25)]",
        tone === "warning" && "shadow-[inset_0_0_0_1px_rgba(201,166,110,0.3)]",
        tone === "danger" && "shadow-[inset_0_0_0_1px_rgba(201,138,138,0.3)]",
        tone === "primary" && "shadow-[inset_0_0_0_1px_rgba(93,153,166,0.28)]",
      )}
    >
      <div
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "success" && "text-[color:var(--capsule-success)]",
          tone === "warning" && "text-[color:var(--capsule-warning)]",
          tone === "danger" && "text-[color:var(--capsule-danger)]",
          tone === "primary" && "text-capsule-primary",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 break-words text-[9px] font-semibold uppercase leading-tight tracking-[0.08em] text-capsule-text-muted sm:text-[10px] sm:tracking-[0.12em]">
        {label}
      </div>
    </div>
  );
}
