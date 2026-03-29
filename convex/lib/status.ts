import type { Doc } from "../_generated/dataModel";
import { MISSED_AFTER_MS } from "./time.js";

export type EffectiveStatus =
  | "pending"
  | "taken_on_time"
  | "snoozed"
  | "missed";

export function getEffectiveStatus(
  log: Doc<"adherenceLogs"> | null,
  now: number,
  scheduledFor: number,
): EffectiveStatus {
  const missedDeadline = scheduledFor + MISSED_AFTER_MS;
  if (!log) {
    if (now > missedDeadline) return "missed";
    return "pending";
  }
  if (log.status === "taken_on_time") return "taken_on_time";
  if (log.status === "missed") return "missed";
  if (log.status === "snoozed") {
    const su = log.snoozeUntil ?? 0;
    if (now < su) return "snoozed";
    if (now > missedDeadline) return "missed";
    return "pending";
  }
  if (now > missedDeadline) return "missed";
  return "pending";
}
