import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  medicationDuration,
  medicationSchedule,
  reminderTime,
} from "./validators";

export default defineSchema({
  userSettings: defineTable({
    userId: v.string(),
    locale: v.union(v.literal("en"), v.literal("ar")),
    timeZone: v.string(),
    updatedAt: v.number(),
    age: v.optional(v.number()),
    sex: v.optional(
      v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("prefer_not_to_say"),
      ),
    ),
    conditions: v.optional(v.string()),
    allergies: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
    /** When false, interruptive medication alarm modal is suppressed. */
    alertsEnabled: v.optional(v.boolean()),
    /** Default snooze length for quick actions (5–30). */
    defaultSnoozeMinutes: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  medications: defineTable({
    userId: v.string(),
    name: v.string(),
    dosage: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminderTimes: v.array(reminderTime),
    schedule: v.optional(medicationSchedule),
    duration: v.optional(medicationDuration),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  adherenceLogs: defineTable({
    userId: v.string(),
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("taken_on_time"),
      v.literal("snoozed"),
      v.literal("missed"),
    ),
    takenAt: v.optional(v.number()),
    snoozeUntil: v.optional(v.number()),
    /** When the user last chose “snooze” for this dose (for timeline after take). */
    snoozedAt: v.optional(v.number()),
    /** Last snooze duration chosen (minutes), for activity feed. */
    snoozeMinutes: v.optional(v.number()),
    /**
     * Wall time of the “next alert” after the last snooze (same as snoozeUntil when active).
     * Kept after take/miss so Today’s schedule can show the outcome at the delayed due time.
     */
    snoozedNextDueAt: v.optional(v.number()),
    /** True after user snoozes this dose; kept after take/miss so the schedule stays two-row accurate. */
    wasSnoozed: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_user_scheduled", ["userId", "scheduledFor"])
    .index("by_lookup", ["userId", "medicationId", "scheduledFor"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  /** Frozen bar-chart totals for completed calendar months (current month stays live in queries). */
  adherenceMonthSnapshots: defineTable({
    userId: v.string(),
    monthKey: v.string(),
    onTime: v.number(),
    delayed: v.number(),
    skipped: v.number(),
    chartTotal: v.number(),
    frozenAt: v.number(),
    /** Bumped when chart rules change; stale rows are recomputed from logs. */
    schemaVersion: v.optional(v.number()),
  }).index("by_user_month", ["userId", "monthKey"]),
});
