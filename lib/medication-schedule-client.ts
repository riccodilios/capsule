import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Doc } from "@/convex/_generated/dataModel";

type Med = Doc<"medications">;

function isoDayInTz(ms: number, timeZone: string): string {
  return formatInTimeZone(ms, timeZone, "yyyy-MM-dd");
}

function weekdaySun0(dayISO: string, timeZone: string): number {
  const instant = fromZonedTime(`${dayISO}T12:00:00`, timeZone);
  const i = Number(formatInTimeZone(instant, timeZone, "i"));
  return i === 7 ? 0 : i;
}

function dayOfMonthInTz(dayISO: string, timeZone: string): number {
  const instant = fromZonedTime(`${dayISO}T12:00:00`, timeZone);
  return Number(formatInTimeZone(instant, timeZone, "d"));
}

export function medicationAppliesToDayClient(
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

export function scheduledUtcMs(
  dayISO: string,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const localIso = `${dayISO}T${hh}:${mm}:00`;
  return fromZonedTime(localIso, timeZone).getTime();
}

/** Next reminder instant after `now`, or null if none in search horizon. */
export function computeNextDoseUtc(
  med: Med,
  timeZone: string,
  now: number,
): number | null {
  const horizonDays = 120;
  const startDayISO = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
  let best: number | null = null;

  for (let i = 0; i < horizonDays; i++) {
    const dayISO = format(addDays(parseISO(startDayISO), i), "yyyy-MM-dd");
    if (!medicationAppliesToDayClient(med, dayISO, timeZone)) continue;
    for (const t of med.reminderTimes) {
      const utc = scheduledUtcMs(dayISO, t.hour, t.minute, timeZone);
      if (utc > now && (best === null || utc < best)) {
        best = utc;
      }
    }
  }

  return best;
}
