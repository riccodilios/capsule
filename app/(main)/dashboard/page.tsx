"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatInTimeZone } from "date-fns-tz";
import { api } from "@/convex/_generated/api";
import { useLocale } from "@/lib/i18n/locale-context";
import { GlassPanel } from "@/components/glass-panel";
import { AdherenceRing, StatMini } from "@/components/adherence-ring";
import {
  MedicationAlarmModal,
  type AlarmSlot,
} from "@/components/medication-alarm-modal";
import {
  DashboardAlertsFeed,
  type FeedItem,
} from "@/components/dashboard-alerts-feed";
import { ScheduleTimeline } from "@/components/schedule-timeline";
import { AdherenceMonthlyChart } from "@/components/adherence-monthly-chart";
import { DashboardDailyTip } from "@/components/dashboard-daily-tip";
import {
  computeMonthlyChartMonthKeys,
  mergeMonthlyHistoryWithKeys,
  normalizeMonthKeyYm,
} from "@/lib/monthly-chart-helpers";
import { DEFAULT_TIME_ZONE } from "@/lib/timezones";
export default function DashboardPage() {
  const { t, dir } = useLocale();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const settings = useQuery(api.userSettings.get, {});
  const dayISO = useMemo(() => {
    const tz = settings?.timeZone ?? DEFAULT_TIME_ZONE;
    return formatInTimeZone(new Date(nowMs), tz, "yyyy-MM-dd");
  }, [settings?.timeZone, nowMs]);

  const summary = useQuery(api.dashboard.getDay, { dayISO });
  const finalizePastMonthSnapshots = useMutation(
    api.dashboard.finalizePastMonthSnapshots,
  );
  const lastFinalizeCalendarYm = useRef<string | null>(null);

  useEffect(() => {
    if (settings == null) return;
    const tz = settings.timeZone ?? DEFAULT_TIME_ZONE;
    const calendarYm = formatInTimeZone(new Date(nowMs), tz, "yyyy-MM");
    if (lastFinalizeCalendarYm.current === calendarYm) return;
    lastFinalizeCalendarYm.current = calendarYm;
    void finalizePastMonthSnapshots({ dayISO }).catch(() => {
      /* Backend may be behind local code until `npx convex dev` / deploy syncs. */
    });
  }, [dayISO, finalizePastMonthSnapshots, nowMs, settings]);

  /** Due "pending" first; then catch-up for past times today with no log (e.g. open app at 7pm for 5pm dose). */
  const alarmSlot = useMemo((): AlarmSlot | null => {
    if (!summary?.slots) return null;
    if (settings?.alertsEnabled === false) return null;

    const pendingDue = summary.slots.filter(
      (s) => s.effective === "pending" && nowMs >= s.scheduledFor,
    );
    pendingDue.sort((a, b) => a.scheduledFor - b.scheduledFor);
    const firstPending = pendingDue[0];
    if (firstPending) {
      return {
        medicationId: firstPending.medicationId,
        medicationName: firstPending.medicationName,
        dosage: firstPending.dosage,
        scheduledFor: firstPending.scheduledFor,
      };
    }

    const catchUp = summary.slots
      .filter((s) => s.log == null && s.scheduledFor < nowMs)
      .sort((a, b) => a.scheduledFor - b.scheduledFor);
    const c = catchUp[0];
    if (!c) return null;
    return {
      medicationId: c.medicationId,
      medicationName: c.medicationName,
      dosage: c.dosage,
      scheduledFor: c.scheduledFor,
    };
  }, [summary?.slots, nowMs, settings?.alertsEnabled]);

  const monthlyChartRows = useMemo(() => {
    if (summary == null) return [];
    const tz = summary.timeZone ?? DEFAULT_TIME_ZONE;
    const fromServer = Array.isArray(summary.monthlyHistory)
      ? summary.monthlyHistory
      : [];
    const meta = summary as {
      monthlyChartFirstMonthYm?: string;
      monthlyChartCurrentYm?: string;
    };
    const firstRaw =
      meta.monthlyChartFirstMonthYm ?? summary.dayISO.slice(0, 7);
    const currentRaw =
      meta.monthlyChartCurrentYm ??
      formatInTimeZone(new Date(nowMs), tz, "yyyy-MM");
    const first = normalizeMonthKeyYm(firstRaw);
    const current = normalizeMonthKeyYm(currentRaw);
    const keys = computeMonthlyChartMonthKeys(first, current);
    return mergeMonthlyHistoryWithKeys(keys, fromServer);
  }, [summary, nowMs]);

  const timelineSlots = useMemo(
    () =>
      (summary?.slots ?? []).map((s) => ({
        medicationId: s.medicationId,
        medicationName: s.medicationName,
        dosage: s.dosage,
        scheduledFor: s.scheduledFor,
        effective: s.effective,
        snoozeUntil: s.log?.snoozeUntil,
        snoozedAt: s.log?.snoozedAt,
        snoozeMinutes: s.log?.snoozeMinutes,
        snoozedNextDueAt: s.log?.snoozedNextDueAt,
        wasSnoozed: s.log?.wasSnoozed,
        takenAt: s.log?.takenAt ?? undefined,
      })),
    [summary?.slots],
  );

  const feed = summary?.feed ?? { upcoming: [], activity: [] };
  const adherencePercent = summary?.adherencePercent ?? 100;

  if (summary === undefined) {
    return (
      <p className="text-capsule-text-muted" role="status">
        {t.common.loading}
      </p>
    );
  }

  if (summary === null) {
    return (
      <p className="text-[color:var(--capsule-danger)]" role="alert">
        {t.common.error}
      </p>
    );
  }

  const counts = summary.counts;

  return (
    <div className="space-y-12" dir={dir}>
      <MedicationAlarmModal
        slot={alarmSlot}
        open={alarmSlot !== null}
        onResolved={() => setNowMs(Date.now())}
      />

      <DashboardDailyTip dayISO={summary.dayISO} />

      <header className="space-y-2">
        <h1 className="capsule-page-title">{t.dashboard.title}</h1>
        <p className="text-sm text-capsule-text-muted">
          {summary.dayISO} · {summary.timeZone}
        </p>
      </header>

      <section className="flex min-w-0 flex-col gap-8">
        <GlassPanel className="min-w-0 border-[color:rgba(110,135,141,0.38)] bg-white/50">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between sm:gap-10">
            <AdherenceRing
              percent={adherencePercent}
              total={counts.applicable}
            />
            <div className="grid w-full min-w-0 max-w-sm gap-3 sm:max-w-none">
              <p className="col-span-3 text-balance text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-capsule-text-muted sm:text-left">
                {t.dashboard.adherenceDaily.breakdownTitle}
              </p>
              <div className="col-span-3 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
                <StatMini
                  label={t.dashboard.adherenceDaily.onTime}
                  value={counts.onTime}
                  tone="success"
                />
                <StatMini
                  label={t.dashboard.adherenceDaily.delayed}
                  value={counts.delayed}
                  tone="warning"
                />
                <StatMini
                  label={t.dashboard.adherenceDaily.skipped}
                  value={counts.skipped}
                  tone="danger"
                />
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="min-w-0">
          <h2 className="capsule-section-title mb-4">
            {t.dashboard.scheduleSection}
          </h2>
          <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50">
            <ScheduleTimeline
              timeZone={summary.timeZone}
              nowMs={nowMs}
              slots={timelineSlots}
            />
          </GlassPanel>
        </div>

        <DashboardAlertsFeed
          upcoming={feed.upcoming as FeedItem[]}
          activity={feed.activity as FeedItem[]}
          nowMs={nowMs}
          timeZone={summary.timeZone}
        />

        <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50">
          <AdherenceMonthlyChart months={monthlyChartRows} />
        </GlassPanel>
      </section>
    </div>
  );
}
