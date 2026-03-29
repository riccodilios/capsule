import { v } from "convex/values";

export const reminderTime = v.object({
  hour: v.number(),
  minute: v.number(),
});

export const medicationSchedule = v.union(
  v.object({ type: v.literal("daily") }),
  v.object({
    type: v.literal("every_n_days"),
    intervalDays: v.number(),
    anchorDate: v.string(),
  }),
  v.object({
    type: v.literal("weekly"),
    weekdays: v.array(v.number()),
  }),
  v.object({
    type: v.literal("monthly"),
    dayOfMonth: v.number(),
  }),
);

export const medicationDuration = v.union(
  v.object({ kind: v.literal("ongoing") }),
  v.object({
    kind: v.literal("temporary"),
    startDate: v.string(),
    endDate: v.string(),
  }),
);
