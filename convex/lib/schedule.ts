import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Doc } from "../_generated/dataModel";

type Med = Doc<"medications">;

function isoDayInTz(ms: number, timeZone: string): string {
  return formatInTimeZone(ms, timeZone, "yyyy-MM-dd");
}

function weekdaySun0(dayISO: string, timeZone: string): number {
  const instant = fromZonedTime(`${dayISO}T12:00:00`, timeZone);
  const i = Number(formatInTimeZone(instant, timeZone, "i"));
  // ISO: Mon=1 … Sun=7 → JS getDay: Sun=0 … Sat=6
  return i === 7 ? 0 : i;
}

function dayOfMonthInTz(dayISO: string, timeZone: string): number {
  const instant = fromZonedTime(`${dayISO}T12:00:00`, timeZone);
  return Number(formatInTimeZone(instant, timeZone, "d"));
}

/**
 * Whether this medication should appear on the user's calendar day (timezone-aware).
 */
export function medicationAppliesToDay(
  med: Med,
  dayISO: string,
  timeZone: string,
): boolean {
  const duration = med.duration ?? { kind: "ongoing" as const };
  if (duration.kind === "temporary") {
    if (dayISO < duration.startDate || dayISO > duration.endDate) {
      return false;
    }
  }

  const schedule = med.schedule ?? { type: "daily" as const };

  switch (schedule.type) {
    case "daily":
      return true;
    case "every_n_days": {
      const anchor =
        schedule.anchorDate ?? isoDayInTz(med.createdAt, timeZone);
      const diff = differenceInCalendarDays(parseISO(dayISO), parseISO(anchor));
      if (diff < 0) return false;
      return diff % schedule.intervalDays === 0;
    }
    case "weekly":
      return schedule.weekdays.includes(weekdaySun0(dayISO, timeZone));
    case "monthly":
      return dayOfMonthInTz(dayISO, timeZone) === schedule.dayOfMonth;
    default:
      return true;
  }
}

/**
 * Earliest UTC instant we count adherence for this medication. Uses `createdAt`
 * when present; combines with `userOnboardingCompletedAt` so legacy rows without
 * `createdAt` still align with onboarding, and `scheduledFor < undefined` never
 * disables the “skip pre‑creation reminders” guard.
 */
export function medicationAccountabilityStartMs(
  med: Med,
  userOnboardingCompletedAt?: number | null,
): number {
  const onboard =
    typeof userOnboardingCompletedAt === "number" &&
    userOnboardingCompletedAt > 0
      ? userOnboardingCompletedAt
      : 0;
  const raw = med.createdAt;
  const medMs = typeof raw === "number" && raw > 0 ? raw : 0;
  return Math.max(medMs, onboard);
}
