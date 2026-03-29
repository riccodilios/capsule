import type { Doc } from "@/convex/_generated/dataModel";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatScheduleSummary(
  med: Doc<"medications">,
  locale: Locale,
  o: Dictionary["onboarding"],
): string {
  const pick = (b: { en: string; ar: string }) =>
    locale === "ar" ? b.ar : b.en;

  const schedule = med.schedule ?? { type: "daily" as const };

  switch (schedule.type) {
    case "daily":
      return pick(o.scheduleDaily);
    case "every_n_days":
      return locale === "ar"
        ? `كل ${schedule.intervalDays} أيام · ${pick(o.anchorDay)} ${schedule.anchorDate}`
        : `Every ${schedule.intervalDays} d · from ${schedule.anchorDate}`;
    case "weekly": {
      const labels = o.weekdaysShort.map((d) => pick(d));
      const names = schedule.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((i) => labels[i] ?? weekdaysEn[i] ?? String(i));
      return locale === "ar"
        ? `${pick(o.scheduleWeekly)}: ${names.join("، ")}`
        : `${pick(o.scheduleWeekly)}: ${names.join(", ")}`;
    }
    case "monthly":
      return locale === "ar"
        ? `${pick(o.scheduleMonthly)} — ${schedule.dayOfMonth}`
        : `${pick(o.scheduleMonthly)} — day ${schedule.dayOfMonth}`;
    default:
      return pick(o.scheduleDaily);
  }
}
