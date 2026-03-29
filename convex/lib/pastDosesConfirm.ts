import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import {
  medicationAccountabilityStartMs,
  medicationAppliesToDay,
} from "./schedule.js";
import { scheduledUtcMs } from "./time.js";

function timeKey(t: { hour: number; minute: number }) {
  return `${t.hour}:${t.minute}`;
}

/**
 * Reminder instants for "today" that fell before tracking started and have no log yet.
 * User should confirm taken vs skipped so adherence does not assume missed.
 */
export async function listPastDoseInstantsNeedingConfirmation(
  ctx: MutationCtx,
  med: Doc<"medications">,
  timeZone: string,
  onboardingCompletedAt: number | null | undefined,
  now: number,
  previousReminderTimes: { hour: number; minute: number }[] | null,
): Promise<{ scheduledFor: number }[]> {
  const todayISO = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${todayISO}T00:00:00`, timeZone).getTime();
  const accountabilityStart = medicationAccountabilityStartMs(
    med,
    onboardingCompletedAt,
  );

  const prevSet =
    previousReminderTimes === null
      ? null
      : new Set(previousReminderTimes.map(timeKey));
  const timesToConsider =
    prevSet === null
      ? med.reminderTimes
      : med.reminderTimes.filter((t) => !prevSet.has(timeKey(t)));

  const out: { scheduledFor: number }[] = [];

  for (const t of timesToConsider) {
    const sf = scheduledUtcMs(todayISO, t.hour, t.minute, timeZone);
    if (sf < dayStart) continue;
    if (sf >= now) continue;
    if (!medicationAppliesToDay(med, todayISO, timeZone)) continue;
    if (sf >= accountabilityStart) continue;

    const existing = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", med.userId)
          .eq("medicationId", med._id)
          .eq("scheduledFor", sf),
      )
      .unique();
    if (existing) continue;

    out.push({ scheduledFor: sf });
  }

  out.sort((a, b) => a.scheduledFor - b.scheduledFor);
  return out;
}

/** Validates a single backfill entry for `recordPastDoseOutcomes`. */
export function assertValidPastDoseConfirmation(
  med: Doc<"medications">,
  timeZone: string,
  onboardingCompletedAt: number | null | undefined,
  now: number,
  scheduledFor: number,
): void {
  const todayISO = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${todayISO}T00:00:00`, timeZone).getTime();
  const accountabilityStart = medicationAccountabilityStartMs(
    med,
    onboardingCompletedAt,
  );

  if (scheduledFor < dayStart) throw new Error("Invalid dose time");
  if (scheduledFor >= now) throw new Error("Dose is not in the past");
  if (!medicationAppliesToDay(med, todayISO, timeZone)) {
    throw new Error("Medication does not apply today");
  }
  if (scheduledFor >= accountabilityStart) {
    throw new Error("Dose is outside confirmation window");
  }

  let matches = false;
  for (const t of med.reminderTimes) {
    if (scheduledUtcMs(todayISO, t.hour, t.minute, timeZone) === scheduledFor) {
      matches = true;
      break;
    }
  }
  if (!matches) throw new Error("Scheduled time does not match medication");
}
