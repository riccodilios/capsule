import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Doc, Id } from "../_generated/dataModel";
import { getEffectiveStatus, type EffectiveStatus } from "./status.js";
import {
  medicationAccountabilityStartMs,
  medicationAppliesToDay,
} from "./schedule.js";
import { MISSED_AFTER_MS, scheduledUtcMs } from "./time.js";

/** Bump when month bar rules change so frozen snapshots are refreshed. */
export const ADHERENCE_MONTH_SNAPSHOT_VERSION = 6;

type DaySlot = {
  medicationId: Id<"medications">;
  medicationName: string;
  dosage?: string;
  scheduledFor: number;
  log: Doc<"adherenceLogs"> | null;
  effective: EffectiveStatus;
};

export function buildSlotsForDay(
  dayISO: string,
  medications: Doc<"medications">[],
  logByKey: Map<string, Doc<"adherenceLogs">>,
  now: number,
  timeZone: string,
  opts?: { userOnboardingCompletedAt?: number | null },
): DaySlot[] {
  const dayStart = fromZonedTime(`${dayISO}T00:00:00`, timeZone).getTime();
  const nextDayISO = format(addDays(parseISO(dayISO), 1), "yyyy-MM-dd");
  const dayEnd = fromZonedTime(`${nextDayISO}T00:00:00`, timeZone).getTime();
  const slots: DaySlot[] = [];
  for (const med of medications) {
    if (!medicationAppliesToDay(med, dayISO, timeZone)) continue;
    const accountabilityStart = medicationAccountabilityStartMs(
      med,
      opts?.userOnboardingCompletedAt,
    );
    for (const t of med.reminderTimes) {
      const scheduledFor = scheduledUtcMs(dayISO, t.hour, t.minute, timeZone);
      if (scheduledFor < dayStart || scheduledFor >= dayEnd) continue;
      // No slot for reminder instants before tracking started (e.g. add at night: skip morning/noon today).
      if (scheduledFor < accountabilityStart) continue;
      const key = `${med._id}_${scheduledFor}`;
      const log = logByKey.get(key) ?? null;
      const effective = getEffectiveStatus(log, now, scheduledFor);
      slots.push({
        medicationId: med._id,
        medicationName: med.name,
        dosage: med.dosage,
        scheduledFor,
        log,
        effective,
      });
    }
  }
  slots.sort((a, b) => a.scheduledFor - b.scheduledFor);
  return slots;
}

function listDaysInCalendarMonth(
  year: number,
  month: number,
  timeZone: string,
): string[] {
  const out: string[] = [];
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  for (let d = 1; d <= 31; d++) {
    const dayISO = `${ym}-${String(d).padStart(2, "0")}`;
    const t = fromZonedTime(`${dayISO}T12:00:00`, timeZone).getTime();
    if (Number.isNaN(t)) continue;
    if (formatInTimeZone(t, timeZone, "yyyy-MM-dd") !== dayISO) continue;
    if (formatInTimeZone(t, timeZone, "yyyy-MM") !== ym) continue;
    out.push(dayISO);
  }
  return out;
}

/** Subtract delta months from (y, m); m is 1–12. */
export function subMonthsFrom(
  y: number,
  m: number,
  delta: number,
): { y: number; m: number } {
  let mm = m - delta;
  let yy = y;
  while (mm <= 0) {
    mm += 12;
    yy -= 1;
  }
  while (mm > 12) {
    mm -= 12;
    yy += 1;
  }
  return { y: yy, m: mm };
}

function classifyAdherenceSlot(
  log: Doc<"adherenceLogs"> | null,
  effective: EffectiveStatus,
): "on_time" | "delayed" | "skipped" | "pending_outcome" {
  if (effective === "missed") return "skipped";
  if (effective === "snoozed") return "delayed";
  if (effective === "taken_on_time") {
    if (
      log?.wasSnoozed === true ||
      log?.snoozedAt != null ||
      (log?.snoozeMinutes != null && log.snoozeMinutes > 0) ||
      log?.snoozedNextDueAt != null
    ) {
      return "delayed";
    }
    return "on_time";
  }
  return "pending_outcome";
}

function classifyForMonthBar(
  log: Doc<"adherenceLogs"> | null,
  effective: EffectiveStatus,
  scheduledFor: number,
  now: number,
): ReturnType<typeof classifyAdherenceSlot> {
  const missedDeadline = scheduledFor + MISSED_AFTER_MS;
  if (effective === "pending" && now > missedDeadline) {
    return classifyAdherenceSlot(log, "missed");
  }
  return classifyAdherenceSlot(log, effective);
}

/**
 * Bar chart: only resolved outcomes. Pending / snoozed (still in play) are omitted.
 */
function classifyForMonthChart(
  log: Doc<"adherenceLogs"> | null,
  effective: EffectiveStatus,
): "on_time" | "delayed" | "skipped" | null {
  if (effective === "pending" || effective === "snoozed") return null;
  if (effective === "missed") return "skipped";
  if (effective === "taken_on_time") {
    if (
      log?.wasSnoozed === true ||
      log?.snoozedAt != null ||
      (log?.snoozeMinutes != null && log.snoozeMinutes > 0) ||
      log?.snoozedNextDueAt != null
    ) {
      return "delayed";
    }
    return "on_time";
  }
  return null;
}

export type MonthChartAggregateOptions = {
  /** Count only doses with scheduledFor >= this (per medication). */
  doseNotBeforeMs: (medicationId: Id<"medications">) => number;
  /**
   * When true (default for chart), only active medications generate calendar slots.
   * Archived meds no longer add “missed” rows for the rest of the month; their history
   * still comes from adherence logs when present.
   */
  activeOnlyForSlots?: boolean;
  /** Passed to buildSlotsForDay (same rule as dose accountability). */
  userOnboardingCompletedAt?: number | null;
};

export function aggregateMonthCounts(
  year: number,
  month: number,
  medications: Doc<"medications">[],
  logs: Doc<"adherenceLogs">[],
  logByKey: Map<string, Doc<"adherenceLogs">>,
  now: number,
  timeZone: string,
  chart?: MonthChartAggregateOptions,
): {
  onTime: number;
  delayed: number;
  skipped: number;
  pendingOutcome: number;
  applicable: number;
  chartTotal: number;
} {
  let onTime = 0;
  let delayed = 0;
  let skipped = 0;
  let pendingOutcome = 0;
  const countedKeys = new Set<string>();
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  const medsForSlots =
    chart && chart.activeOnlyForSlots !== false
      ? medications.filter((m) => m.active)
      : medications;

  for (const log of logs) {
    if (formatInTimeZone(log.scheduledFor, timeZone, "yyyy-MM") !== ym) {
      continue;
    }
    if (log.scheduledFor > now) continue;
    const key = `${log.medicationId}_${log.scheduledFor}`;
    if (chart && log.scheduledFor < chart.doseNotBeforeMs(log.medicationId)) {
      countedKeys.add(key);
      continue;
    }
    countedKeys.add(key);
    const effective = getEffectiveStatus(log, now, log.scheduledFor);
    if (chart) {
      const c = classifyForMonthChart(log, effective);
      if (c === "on_time") onTime++;
      else if (c === "delayed") delayed++;
      else if (c === "skipped") skipped++;
      continue;
    }
    const c = classifyForMonthBar(log, effective, log.scheduledFor, now);
    if (c === "on_time") onTime++;
    else if (c === "delayed") delayed++;
    else if (c === "skipped") skipped++;
    else pendingOutcome++;
  }

  for (const dayISO of listDaysInCalendarMonth(year, month, timeZone)) {
    const slots = buildSlotsForDay(
      dayISO,
      medsForSlots,
      logByKey,
      now,
      timeZone,
      { userOnboardingCompletedAt: chart?.userOnboardingCompletedAt },
    );
    for (const s of slots) {
      const key = `${s.medicationId}_${s.scheduledFor}`;
      if (countedKeys.has(key)) continue;
      if (s.scheduledFor > now) {
        countedKeys.add(key);
        continue;
      }
      if (chart && s.scheduledFor < chart.doseNotBeforeMs(s.medicationId)) {
        countedKeys.add(key);
        continue;
      }
      countedKeys.add(key);
      if (chart) {
        const c = classifyForMonthChart(s.log, s.effective);
        if (c === "on_time") onTime++;
        else if (c === "delayed") delayed++;
        else if (c === "skipped") skipped++;
        continue;
      }
      const c = classifyForMonthBar(
        s.log,
        s.effective,
        s.scheduledFor,
        now,
      );
      if (c === "on_time") onTime++;
      else if (c === "delayed") delayed++;
      else if (c === "skipped") skipped++;
      else pendingOutcome++;
    }
  }

  const chartTotal = onTime + delayed + skipped;
  const applicable = chartTotal + pendingOutcome;
  return {
    onTime,
    delayed,
    skipped,
    pendingOutcome,
    applicable,
    chartTotal,
  };
}

/** Past-dose slots for the selected calendar day (same classification as schedule / month bars). */
export function aggregateDayCountsFromSlots(
  slots: {
    medicationId: Id<"medications">;
    scheduledFor: number;
    log: Doc<"adherenceLogs"> | null;
    effective: EffectiveStatus;
  }[],
  now: number,
  chart?: MonthChartAggregateOptions,
): {
  onTime: number;
  delayed: number;
  skipped: number;
  pendingOutcome: number;
  applicable: number;
  chartTotal: number;
} {
  let onTime = 0;
  let delayed = 0;
  let skipped = 0;
  let pendingOutcome = 0;
  for (const s of slots) {
    if (s.scheduledFor > now) continue;
    if (chart && s.scheduledFor < chart.doseNotBeforeMs(s.medicationId)) {
      continue;
    }
    const c = classifyForMonthBar(s.log, s.effective, s.scheduledFor, now);
    if (c === "on_time") onTime++;
    else if (c === "delayed") delayed++;
    else if (c === "skipped") skipped++;
    else pendingOutcome++;
  }
  const chartTotal = onTime + delayed + skipped;
  const applicable = chartTotal + pendingOutcome;
  return {
    onTime,
    delayed,
    skipped,
    pendingOutcome,
    applicable,
    chartTotal,
  };
}
