import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Doc, Id } from "./_generated/dataModel";
import { getEffectiveStatus } from "./lib/status.js";
import {
  medicationAccountabilityStartMs,
  medicationAppliesToDay,
} from "./lib/schedule.js";
import {
  ADHERENCE_MONTH_SNAPSHOT_VERSION,
  aggregateDayCountsFromSlots,
  aggregateMonthCounts,
  buildSlotsForDay,
  subMonthsFrom,
} from "./lib/monthlyAggregation.js";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";
import {
  computeMonthlyChartMonthKeys,
  normalizeMonthKeyYm,
} from "./lib/monthlyChartWindow.js";
import { adherenceChartAnchorMs } from "./lib/chartAnchor.js";
import { MISSED_AFTER_MS, scheduledUtcMs } from "./lib/time.js";

/** How far ahead to scan for pending doses in the upcoming feed. */
const UPCOMING_FEED_LOOKAHEAD_DAYS = 120;
const MAX_UPCOMING_FEED_ITEMS = 40;

type FeedItem = {
  id: string;
  kind: "upcoming" | "taken" | "missed" | "snoozed";
  medicationId: Id<"medications">;
  medicationName: string;
  dosage?: string;
  at: number;
  scheduledFor: number;
  snoozeMinutes?: number;
};

function collectUpcomingFeedItems(
  medications: Doc<"medications">[],
  startDayISO: string,
  timeZone: string,
  logByKey: Map<string, Doc<"adherenceLogs">>,
  now: number,
  userOnboardingCompletedAt?: number | null,
): FeedItem[] {
  const out: FeedItem[] = [];
  for (let offset = 0; offset <= UPCOMING_FEED_LOOKAHEAD_DAYS; offset++) {
    const dISO = format(addDays(parseISO(startDayISO), offset), "yyyy-MM-dd");
    for (const med of medications) {
      if (!medicationAppliesToDay(med, dISO, timeZone)) continue;
      const accountabilityStart = medicationAccountabilityStartMs(
        med,
        userOnboardingCompletedAt,
      );
      for (const t of med.reminderTimes) {
        const scheduledFor = scheduledUtcMs(dISO, t.hour, t.minute, timeZone);
        if (scheduledFor < accountabilityStart) continue;
        if (scheduledFor <= now) continue;
        const key = `${med._id}_${scheduledFor}`;
        const log = logByKey.get(key) ?? null;
        if (getEffectiveStatus(log, now, scheduledFor) !== "pending") continue;
        out.push({
          id: `up-${med._id}-${scheduledFor}`,
          kind: "upcoming",
          medicationId: med._id,
          medicationName: med.name,
          dosage: med.dosage,
          at: scheduledFor,
          scheduledFor,
        });
      }
    }
  }
  out.sort((a, b) => a.scheduledFor - b.scheduledFor);
  const nextPerMed: FeedItem[] = [];
  const seenMed = new Set<string>();
  for (const item of out) {
    const medKey = String(item.medicationId);
    if (seenMed.has(medKey)) continue;
    seenMed.add(medKey);
    nextPerMed.push(item);
  }
  return nextPerMed.slice(0, MAX_UPCOMING_FEED_ITEMS);
}

export const getDay = query({
  args: { dayISO: v.string() },
  handler: async (ctx, { dayISO }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;

    const dayStart = fromZonedTime(`${dayISO}T00:00:00`, timeZone).getTime();
    const nextDayISO = format(addDays(parseISO(dayISO), 1), "yyyy-MM-dd");
    const dayEnd = fromZonedTime(`${nextDayISO}T00:00:00`, timeZone).getTime();

    const medicationsAll = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const medications = medicationsAll.filter((m) => m.active);

    const now = Date.now();
    const chartAnchorMs = adherenceChartAnchorMs(
      settings ?? null,
      medicationsAll,
      now,
    );
    const currentYm = normalizeMonthKeyYm(
      formatInTimeZone(now, timeZone, "yyyy-MM"),
    );
    let firstMonthYm = normalizeMonthKeyYm(
      formatInTimeZone(chartAnchorMs, timeZone, "yyyy-MM"),
    );
    if (firstMonthYm > currentYm) {
      firstMonthYm = currentYm;
    }
    const medById = new Map(
      medicationsAll.map((m) => [m._id, m] as const),
    );
    const monthChartOpts = {
      doseNotBeforeMs: (medicationId: Id<"medications">) => {
        const med = medById.get(medicationId);
        if (!med) return chartAnchorMs;
        const start = medicationAccountabilityStartMs(
          med,
          settings?.onboardingCompletedAt,
        );
        return Math.max(chartAnchorMs, start);
      },
      userOnboardingCompletedAt: settings?.onboardingCompletedAt,
    };

    const monthKeysForChart = computeMonthlyChartMonthKeys(
      firstMonthYm,
      currentYm,
    );
    const firstChartYm = monthKeysForChart[0] ?? currentYm;
    const oldestMonthFirst = `${firstChartYm}-01`;
    const earliestChartMs = fromZonedTime(
      `${oldestMonthFirst}T00:00:00`,
      timeZone,
    ).getTime();

    /** Include all logs back to chart window + padding (archived meds + old doses). */
    const logLower = Math.max(
      0,
      earliestChartMs - 400 * 86400000,
    );
    const logUpper = Math.max(
      dayEnd,
      now + UPCOMING_FEED_LOOKAHEAD_DAYS * 86400000,
    );
    const logs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_scheduled", (q) =>
        q.eq("userId", identity.subject).gte("scheduledFor", logLower),
      )
      .filter((q) => q.lt(q.field("scheduledFor"), logUpper))
      .collect();

    const logByKey = new Map<string, Doc<"adherenceLogs">>();
    for (const log of logs) {
      logByKey.set(`${log.medicationId}_${log.scheduledFor}`, log);
    }

    const slots = buildSlotsForDay(
      dayISO,
      medications,
      logByKey,
      now,
      timeZone,
      { userOnboardingCompletedAt: settings?.onboardingCompletedAt },
    );

    const dayCounts = aggregateDayCountsFromSlots(slots, now, monthChartOpts);
    const adherencePercent =
      dayCounts.applicable === 0
        ? 100
        : Math.round((dayCounts.onTime / dayCounts.applicable) * 100);

    const monthlyHistory: {
      monthKey: string;
      onTime: number;
      delayed: number;
      skipped: number;
      chartTotal: number;
    }[] = [];
    for (const monthKey of monthKeysForChart) {
      const y = parseInt(monthKey.slice(0, 4), 10);
      const m = parseInt(monthKey.slice(5, 7), 10);

      if (monthKey > currentYm) {
        monthlyHistory.push({
          monthKey,
          onTime: 0,
          delayed: 0,
          skipped: 0,
          chartTotal: 0,
        });
        continue;
      }
      if (monthKey < firstMonthYm) {
        monthlyHistory.push({
          monthKey,
          onTime: 0,
          delayed: 0,
          skipped: 0,
          chartTotal: 0,
        });
        continue;
      }

      let onTime: number;
      let delayed: number;
      let skipped: number;
      let chartTotal: number;

      if (monthKey < currentYm) {
        const snap = await ctx.db
          .query("adherenceMonthSnapshots")
          .withIndex("by_user_month", (q) =>
            q.eq("userId", identity.subject).eq("monthKey", monthKey),
          )
          .unique();
        if (
          snap &&
          snap.schemaVersion === ADHERENCE_MONTH_SNAPSHOT_VERSION
        ) {
          onTime = snap.onTime;
          delayed = snap.delayed;
          skipped = snap.skipped;
          chartTotal = snap.chartTotal;
        } else {
          const c = aggregateMonthCounts(
            y,
            m,
            medicationsAll,
            logs,
            logByKey,
            now,
            timeZone,
            monthChartOpts,
          );
          onTime = c.onTime;
          delayed = c.delayed;
          skipped = c.skipped;
          chartTotal = c.chartTotal;
        }
      } else {
        const c = aggregateMonthCounts(
          y,
          m,
          medicationsAll,
          logs,
          logByKey,
          now,
          timeZone,
          monthChartOpts,
        );
        onTime = c.onTime;
        delayed = c.delayed;
        skipped = c.skipped;
        chartTotal = c.chartTotal;
      }

      monthlyHistory.push({
        monthKey,
        onTime,
        delayed,
        skipped,
        chartTotal,
      });
    }

    const upcoming = collectUpcomingFeedItems(
      medications,
      dayISO,
      timeZone,
      logByKey,
      now,
      settings?.onboardingCompletedAt,
    );

    const recentLogs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_updated", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(40);

    const activity: FeedItem[] = [];
    const seenMissedKeys = new Set<string>();

    for (const log of recentLogs) {
      const med = await ctx.db.get(log.medicationId);
      if (
        med &&
        log.scheduledFor <
          medicationAccountabilityStartMs(med, settings?.onboardingCompletedAt)
      ) {
        continue;
      }
      const name = med?.name ?? "—";
      const dosage = med?.dosage;
      const base = {
        medicationId: log.medicationId,
        medicationName: name,
        dosage,
        scheduledFor: log.scheduledFor,
        snoozeMinutes: log.snoozeMinutes,
      };
      if (log.status === "taken_on_time") {
        const atTaken = log.takenAt ?? log.updatedAt;
        const hadDelay =
          log.snoozedAt != null ||
          (log.snoozeMinutes != null && log.snoozeMinutes > 0);
        if (hadDelay) {
          const mins = log.snoozeMinutes ?? 15;
          const atDelay =
            log.snoozedAt ??
            Math.max(log.scheduledFor, atTaken - mins * 60 * 1000);
          activity.push({
            id: `log-${log._id}-delay`,
            kind: "snoozed",
            ...base,
            snoozeMinutes: mins,
            at: atDelay,
          });
        }
        activity.push({
          id: `log-${log._id}`,
          kind: "taken",
          ...base,
          at: atTaken,
        });
      } else if (log.status === "missed") {
        const key = `${log.medicationId}_${log.scheduledFor}`;
        seenMissedKeys.add(key);
        activity.push({
          id: `log-${log._id}`,
          kind: "missed",
          ...base,
          at: log.updatedAt,
        });
      } else if (log.status === "snoozed") {
        activity.push({
          id: `log-${log._id}`,
          kind: "snoozed",
          ...base,
          at: log.updatedAt,
        });
      }
    }

    for (const s of slots) {
      if (s.effective !== "missed") continue;
      const key = `${s.medicationId}_${s.scheduledFor}`;
      if (seenMissedKeys.has(key)) continue;
      activity.push({
        id: `syn-missed-${key}`,
        kind: "missed",
        medicationId: s.medicationId,
        medicationName: s.medicationName,
        dosage: s.dosage,
        scheduledFor: s.scheduledFor,
        at: Math.min(now, s.scheduledFor + MISSED_AFTER_MS),
      });
    }

    activity.sort((a, b) => b.at - a.at);

    return {
      dayISO,
      timeZone,
      slots,
      counts: {
        onTime: dayCounts.onTime,
        delayed: dayCounts.delayed,
        skipped: dayCounts.skipped,
        pendingOutcome: dayCounts.pendingOutcome,
        applicable: dayCounts.applicable,
        chartTotal: dayCounts.chartTotal,
      },
      adherencePercent,
      monthlyHistory,
      monthlyChartFirstMonthYm: firstMonthYm,
      monthlyChartCurrentYm: currentYm,
      feed: {
        upcoming,
        activity: activity.slice(0, 28),
      },
    };
  },
});

/**
 * Locks completed calendar months into `adherenceMonthSnapshots`.
 * Defined in this module so it deploys with `getDay` (same Convex bundle users already push).
 */
export const finalizePastMonthSnapshots = mutation({
  args: { dayISO: v.string() },
  handler: async (ctx, { dayISO }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
    const now = Date.now();
    const currentYm = normalizeMonthKeyYm(
      formatInTimeZone(now, timeZone, "yyyy-MM"),
    );

    const medicationsAll = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const chartAnchorMs = adherenceChartAnchorMs(
      settings ?? null,
      medicationsAll,
      now,
    );
    let firstMonthYm = normalizeMonthKeyYm(
      formatInTimeZone(chartAnchorMs, timeZone, "yyyy-MM"),
    );
    if (firstMonthYm > currentYm) {
      firstMonthYm = currentYm;
    }

    const monthKeysForChart = computeMonthlyChartMonthKeys(
      firstMonthYm,
      currentYm,
    );
    const firstChartYm = monthKeysForChart[0] ?? currentYm;
    const oldestMonthFirst = `${firstChartYm}-01`;
    const earliestChartMs = fromZonedTime(
      `${oldestMonthFirst}T00:00:00`,
      timeZone,
    ).getTime();

    const nextDayISO = format(addDays(parseISO(dayISO), 1), "yyyy-MM-dd");
    const dayEnd = fromZonedTime(`${nextDayISO}T00:00:00`, timeZone).getTime();

    const logLower = Math.max(0, earliestChartMs - 400 * 86400000);
    const logUpper = Math.max(
      dayEnd,
      now + UPCOMING_FEED_LOOKAHEAD_DAYS * 86400000,
    );
    const medByIdFinalize = new Map(
      medicationsAll.map((m) => [m._id, m] as const),
    );
    const monthChartOpts = {
      doseNotBeforeMs: (medicationId: Id<"medications">) => {
        const med = medByIdFinalize.get(medicationId);
        if (!med) return chartAnchorMs;
        const start = medicationAccountabilityStartMs(
          med,
          settings?.onboardingCompletedAt,
        );
        return Math.max(chartAnchorMs, start);
      },
      userOnboardingCompletedAt: settings?.onboardingCompletedAt,
    };

    const logs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_scheduled", (q) =>
        q.eq("userId", identity.subject).gte("scheduledFor", logLower),
      )
      .filter((q) => q.lt(q.field("scheduledFor"), logUpper))
      .collect();

    const logByKey = new Map<string, Doc<"adherenceLogs">>();
    for (const log of logs) {
      logByKey.set(`${log.medicationId}_${log.scheduledFor}`, log);
    }

    const curY = parseInt(currentYm.slice(0, 4), 10);
    const curM = parseInt(currentYm.slice(5, 7), 10);
    const firstCompleted = subMonthsFrom(curY, curM, 1);
    let fy = firstCompleted.y;
    let fm = firstCompleted.m;
    for (let step = 0; step < 48; step++) {
      const monthKey = `${fy}-${String(fm).padStart(2, "0")}`;
      if (monthKey < firstMonthYm) break;
      if (monthKey >= currentYm) break;

      const y = fy;
      const m = fm;

      const existingSnap = await ctx.db
        .query("adherenceMonthSnapshots")
        .withIndex("by_user_month", (q) =>
          q.eq("userId", identity.subject).eq("monthKey", monthKey),
        )
        .unique();
      if (
        existingSnap?.schemaVersion === ADHERENCE_MONTH_SNAPSHOT_VERSION
      ) {
        continue;
      }

      const c = aggregateMonthCounts(
        y,
        m,
        medicationsAll,
        logs,
        logByKey,
        now,
        timeZone,
        monthChartOpts,
      );

      const row = {
        onTime: c.onTime,
        delayed: c.delayed,
        skipped: c.skipped,
        chartTotal: c.chartTotal,
        frozenAt: now,
        schemaVersion: ADHERENCE_MONTH_SNAPSHOT_VERSION,
      };

      if (existingSnap) {
        await ctx.db.patch(existingSnap._id, row);
      } else {
        await ctx.db.insert("adherenceMonthSnapshots", {
          userId: identity.subject,
          monthKey,
          ...row,
        });
      }

      const older = subMonthsFrom(fy, fm, 1);
      fy = older.y;
      fm = older.m;
    }
  },
});
