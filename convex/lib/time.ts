import { fromZonedTime } from "date-fns-tz";

export const SNOOZE_MINUTES_DEFAULT = 15;
/** After this window from scheduled time without a taken action, a dose is "missed". */
export const MISSED_AFTER_MS = 2 * 60 * 60 * 1000;

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
