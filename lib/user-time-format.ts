import type { Locale } from "@/lib/i18n/dictionaries";

export function localeForIntl(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-US";
}

/** Clock time of an instant in the user's configured timezone (not the browser default). */
export function formatClockInZone(
  ms: number,
  locale: Locale,
  timeZone: string,
): string {
  return new Date(ms).toLocaleTimeString(localeForIntl(locale), {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Used for “next dose” cards and similar. */
export function formatDateTimeShortInZone(
  ms: number,
  locale: Locale,
  timeZone: string,
): string {
  return new Date(ms).toLocaleString(localeForIntl(locale), {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Activity feed secondary line under an event. */
export function formatActivityHintInZone(
  ms: number,
  locale: Locale,
  timeZone: string,
): string {
  return new Date(ms).toLocaleString(localeForIntl(locale), {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}
