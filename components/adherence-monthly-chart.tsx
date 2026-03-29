"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/cn";
import { MONTHLY_CHART_BAR_COUNT } from "@/lib/monthly-chart-constants";
import { emptyDashboardChartBars } from "@/lib/monthly-chart-helpers";

export const MONTHLY_CHART_COLUMNS = MONTHLY_CHART_BAR_COUNT;

export type MonthlyAdherenceBar = {
  monthKey: string;
  onTime: number;
  delayed: number;
  skipped: number;
  chartTotal: number;
};

/** Oldest → newest: past → current → future placeholders (loading / error fallback). */
export function buildFallbackMonthlyHistory(dayISO: string): MonthlyAdherenceBar[] {
  return emptyDashboardChartBars(dayISO);
}

export function AdherenceMonthlyChart({
  months,
}: {
  months: MonthlyAdherenceBar[];
}) {
  const { t, locale, dir } = useLocale();
  const chartH = 168;
  const maxTotal = Math.max(
    1,
    ...months.map((m) => m.chartTotal),
  );

  return (
    <div className="w-full min-w-0" dir={dir}>
      <h3 className="mb-4 capsule-section-title text-base">
        {t.dashboard.monthlyChartSection}
      </h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-capsule-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: "var(--capsule-success)" }}
            aria-hidden
          />
          {t.dashboard.chartLegendOnTime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: "var(--capsule-warning)" }}
            aria-hidden
          />
          {t.dashboard.chartLegendDelayed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: "var(--capsule-danger)" }}
            aria-hidden
          />
          {t.dashboard.chartLegendSkipped}
        </span>
      </div>
      {months.length === 0 ? (
        <p className="mt-4 text-sm text-capsule-text-muted">
          {t.dashboard.monthlyChartEmpty}
        </p>
      ) : (
        <div className="mt-4 w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${months.length}, minmax(2.75rem, 1fr))`,
              minWidth: `max(100%, ${months.length * 2.75}rem)`,
            }}
            role="img"
            aria-label={t.dashboard.monthlyChartSection}
          >
          {months.map((m, idx) => {
          const label = formatMonthLabel(m.monthKey, locale);
          const total = m.chartTotal;
          const barH =
            total === 0 ? 10 : (total / maxTotal) * chartH;
          const barPx = Math.max(barH, total === 0 ? 10 : 4);

          return (
            <div
              key={`${m.monthKey}-${idx}`}
              className="flex min-w-0 flex-col items-center justify-end"
            >
              <div
                className="mx-auto flex w-full max-w-[3.5rem] min-w-[2.25rem] flex-col overflow-hidden rounded-t-[5px] bg-[rgba(110,135,141,0.14)]"
                style={{ height: barPx }}
                title={`${label}: ${m.onTime} on time · ${m.delayed} delayed · ${m.skipped} skipped`}
              >
                {total > 0 ? (
                  <>
                    {m.skipped > 0 ? (
                      <div
                        className="w-full min-h-[3px]"
                        style={{
                          flexGrow: m.skipped,
                          flexBasis: 0,
                          background: "var(--capsule-danger)",
                        }}
                      />
                    ) : null}
                    {m.delayed > 0 ? (
                      <div
                        className="w-full min-h-[3px]"
                        style={{
                          flexGrow: m.delayed,
                          flexBasis: 0,
                          background: "var(--capsule-warning)",
                        }}
                      />
                    ) : null}
                    {m.onTime > 0 ? (
                      <div
                        className="w-full min-h-[3px]"
                        style={{
                          flexGrow: m.onTime,
                          flexBasis: 0,
                          background: "var(--capsule-success)",
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
              <span
                className={cn(
                  "mt-2 max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-capsule-text-muted",
                  locale === "ar" && "font-arabic",
                )}
              >
                {label}
              </span>
            </div>
          );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatMonthLabel(monthKey: string, locale: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  const d = new Date(y, mo - 1, 1);
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    year: "numeric",
  });
}
