"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/cn";

type Counts = {
  taken: number;
  snoozed: number;
  missed: number;
  pending: number;
  total: number;
};

export function AdherenceOverview({ counts }: { counts: Counts }) {
  const { t } = useLocale();
  const { taken, snoozed, missed, pending, total } = counts;
  if (total === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          t.dashboard.stats.taken,
          t.dashboard.stats.snoozed,
          t.dashboard.stats.missed,
          t.dashboard.stats.pending,
        ].map((label) => (
          <div key={label} className="capsule-stat-pill px-4 py-4 text-center">
            <div className="text-2xl font-semibold tabular-nums text-capsule-text-muted/50">
              0
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-capsule-text-muted">
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="space-y-6">
      <div
        className="capsule-progress-track"
        role="img"
        aria-label={`${t.dashboard.stats.total}: ${total}`}
      >
        {taken > 0 && (
          <div
            className="min-w-0 transition-[width]"
            style={{
              width: `${pct(taken)}%`,
              backgroundColor: "var(--capsule-success)",
            }}
            title={`${t.dashboard.stats.taken}: ${taken}`}
          />
        )}
        {snoozed > 0 && (
          <div
            className="min-w-0"
            style={{
              width: `${pct(snoozed)}%`,
              backgroundColor: "var(--capsule-warning)",
            }}
            title={`${t.dashboard.stats.snoozed}: ${snoozed}`}
          />
        )}
        {pending > 0 && (
          <div
            className="min-w-0"
            style={{
              width: `${pct(pending)}%`,
              backgroundColor: "var(--capsule-primary)",
              opacity: 0.85,
            }}
            title={`${t.dashboard.stats.pending}: ${pending}`}
          />
        )}
        {missed > 0 && (
          <div
            className="min-w-0"
            style={{
              width: `${pct(missed)}%`,
              backgroundColor: "var(--capsule-danger)",
            }}
            title={`${t.dashboard.stats.missed}: ${missed}`}
          />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t.dashboard.stats.taken}
          value={taken}
          className="text-[color:var(--capsule-success)]"
        />
        <Stat
          label={t.dashboard.stats.snoozed}
          value={snoozed}
          className="text-[color:var(--capsule-warning)]"
        />
        <Stat
          label={t.dashboard.stats.pending}
          value={pending}
          className="text-capsule-primary"
        />
        <Stat
          label={t.dashboard.stats.missed}
          value={missed}
          className="text-[color:var(--capsule-danger)]"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="capsule-stat-pill px-4 py-4 text-center">
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums",
          className ?? "text-capsule-text",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-capsule-text-muted">
        {label}
      </div>
    </div>
  );
}
