import { formatInTimeZone } from "date-fns-tz";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Bilingual, Dictionary } from "@/lib/i18n/dictionaries";

export type ScheduleType = "daily" | "every_n_days" | "weekly" | "monthly";

export type MedicationDraft = {
  id: string;
  name: string;
  dosage: string;
  scheduleType: ScheduleType;
  intervalDays: number;
  anchorDate: string;
  weekdays: number[];
  dayOfMonth: number;
  reminderTimes: { hour: number; minute: number }[];
  durationKind: "ongoing" | "temporary";
  startDate: string;
  endDate: string;
};

export function todayISO(timeZone: string): string {
  return formatInTimeZone(Date.now(), timeZone, "yyyy-MM-dd");
}

export function newMedDraft(timeZone: string): MedicationDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    dosage: "",
    scheduleType: "daily",
    intervalDays: 2,
    anchorDate: todayISO(timeZone),
    weekdays: [1],
    dayOfMonth: 1,
    reminderTimes: [{ hour: -1, minute: 0 }],
    durationKind: "ongoing",
    startDate: todayISO(timeZone),
    endDate: todayISO(timeZone),
  };
}

/**
 * Parses `input[type=time]` values. Browsers may return `HH:MM` or `HH:MM:SS`
 * (and rarely fractional seconds); only accepting `HH:MM` caused updates to be
 * ignored and the field to snap back to the old time.
 */
/** Normalize Arabic-Indic / Eastern Arabic digits to ASCII for parsing. */
function normalizeTimeDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x0660 && c <= 0x0669) out += String(c - 0x0660 + 0x30);
    else if (c >= 0x06f0 && c <= 0x06f9) out += String(c - 0x06f0 + 0x30);
    else out += ch;
  }
  return out;
}

export function parseTime(s: string): { hour: number; minute: number } | null {
  const trimmed = normalizeTimeDigits(s.trim());
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length < 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Prefer the DOM date value — matches browser locale/12h UI reliably. */
export function timeFromInput(el: HTMLInputElement): {
  hour: number;
  minute: number;
} | null {
  const vd = el.valueAsDate;
  if (vd && !Number.isNaN(vd.getTime())) {
    return { hour: vd.getHours(), minute: vd.getMinutes() };
  }
  return parseTime(el.value);
}

export function formatTime(t: { hour: number; minute: number }): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

export type AmPm = "am" | "pm";

/** 24h → 12h clock parts for UI. */
export function to12h(hour24: number): { h12: number; ampm: AmPm } {
  if (hour24 < 0) return { h12: 12, ampm: "am" };
  if (hour24 === 0) return { h12: 12, ampm: "am" };
  if (hour24 < 12) return { h12: hour24, ampm: "am" };
  if (hour24 === 12) return { h12: 12, ampm: "pm" };
  return { h12: hour24 - 12, ampm: "pm" };
}

/** 12h + AM/PM → stored 24h hour + minute. */
export function from12h(
  h12: number,
  minute: number,
  ampm: AmPm,
): { hour: number; minute: number } {
  const h = Math.min(12, Math.max(1, Math.floor(h12)));
  const m = Math.min(59, Math.max(0, Math.floor(minute)));
  let hour24: number;
  if (ampm === "am") {
    hour24 = h === 12 ? 0 : h;
  } else {
    hour24 = h === 12 ? 12 : h + 12;
  }
  return { hour: hour24, minute: m };
}

export function docToDraft(
  med: Doc<"medications">,
  timeZone: string,
): MedicationDraft {
  const schedule = med.schedule ?? { type: "daily" as const };
  let scheduleType: ScheduleType = "daily";
  let intervalDays = 2;
  let anchorDate = todayISO(timeZone);
  let weekdays = [1];
  let dayOfMonth = 1;

  if (schedule.type === "every_n_days") {
    scheduleType = "every_n_days";
    intervalDays = schedule.intervalDays;
    anchorDate = schedule.anchorDate;
  } else if (schedule.type === "weekly") {
    scheduleType = "weekly";
    weekdays =
      schedule.weekdays.length > 0 ? [...schedule.weekdays] : [1];
  } else if (schedule.type === "monthly") {
    scheduleType = "monthly";
    dayOfMonth = schedule.dayOfMonth;
  }

  const duration = med.duration ?? { kind: "ongoing" as const };
  const durationKind = duration.kind === "temporary" ? "temporary" : "ongoing";
  const start =
    duration.kind === "temporary" ? duration.startDate : todayISO(timeZone);
  const end =
    duration.kind === "temporary" ? duration.endDate : todayISO(timeZone);

  return {
    id: med._id,
    name: med.name,
    dosage: med.dosage ?? "",
    scheduleType,
    intervalDays,
    anchorDate,
    weekdays,
    dayOfMonth,
    reminderTimes:
      med.reminderTimes.length > 0
        ? med.reminderTimes.map((r) => ({ ...r }))
        : [{ hour: -1, minute: 0 }],
    durationKind,
    startDate: start,
    endDate: end,
  };
}

export function draftToApi(
  d: MedicationDraft,
  timeZone: string,
): {
  name: string;
  dosage?: string;
  reminderTimes: { hour: number; minute: number }[];
  schedule:
    | { type: "daily" }
    | { type: "every_n_days"; intervalDays: number; anchorDate: string }
    | { type: "weekly"; weekdays: number[] }
    | { type: "monthly"; dayOfMonth: number };
  duration:
    | { kind: "ongoing" }
    | { kind: "temporary"; startDate: string; endDate: string };
} {
  let schedule:
    | { type: "daily" }
    | { type: "every_n_days"; intervalDays: number; anchorDate: string }
    | { type: "weekly"; weekdays: number[] }
    | { type: "monthly"; dayOfMonth: number };
  switch (d.scheduleType) {
    case "daily":
      schedule = { type: "daily" };
      break;
    case "every_n_days":
      schedule = {
        type: "every_n_days",
        intervalDays: d.intervalDays,
        anchorDate: d.anchorDate || todayISO(timeZone),
      };
      break;
    case "weekly":
      schedule = {
        type: "weekly",
        weekdays: [...new Set(d.weekdays)].sort((a, b) => a - b),
      };
      break;
    case "monthly":
      schedule = { type: "monthly", dayOfMonth: d.dayOfMonth };
      break;
  }
  const duration =
    d.durationKind === "ongoing"
      ? ({ kind: "ongoing" as const })
      : ({
          kind: "temporary" as const,
          startDate: d.startDate,
          endDate: d.endDate,
        });
  const reminderTimes = d.reminderTimes.map((t) => ({
    hour: Math.min(23, Math.max(0, Math.floor(t.hour))),
    minute: Math.min(59, Math.max(0, Math.floor(t.minute))),
  }));

  return {
    name: d.name.trim(),
    dosage: d.dosage.trim() || undefined,
    reminderTimes,
    schedule,
    duration,
  };
}

export function isValidReminderClock(hour: number, minute: number): boolean {
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  const h = Math.floor(hour);
  const m = Math.floor(minute);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function validateMedicationDraft(
  d: MedicationDraft,
  o: Dictionary["onboarding"],
): Bilingual | null {
  if (!d.name.trim()) return o.validationMedName;
  if (d.reminderTimes.length === 0) return o.validationTimes;
  for (const t of d.reminderTimes) {
    if (!isValidReminderClock(t.hour, t.minute)) {
      return o.validationReminderTime;
    }
  }
  if (d.scheduleType === "weekly" && d.weekdays.length === 0) {
    return o.validationWeekly;
  }
  if (
    d.scheduleType === "monthly" &&
    (d.dayOfMonth < 1 || d.dayOfMonth > 31)
  ) {
    return o.validationMonthly;
  }
  if (
    d.scheduleType === "every_n_days" &&
    (d.intervalDays < 1 || d.intervalDays > 365)
  ) {
    return o.validationInterval;
  }
  if (d.durationKind === "temporary") {
    if (!d.startDate || !d.endDate) return o.validationDates;
    if (d.startDate > d.endDate) return o.validationDates;
  }
  return null;
}
