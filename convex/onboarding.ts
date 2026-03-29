import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";
import { listPastDoseInstantsNeedingConfirmation } from "./lib/pastDosesConfirm.js";
import {
  medicationDuration,
  medicationSchedule,
  reminderTime,
} from "./validators";

const medicationInput = v.object({
  name: v.string(),
  dosage: v.optional(v.string()),
  reminderTimes: v.array(reminderTime),
  schedule: medicationSchedule,
  duration: medicationDuration,
});

type ScheduleIn = {
  type: "daily";
} | {
  type: "every_n_days";
  intervalDays: number;
  anchorDate: string;
} | {
  type: "weekly";
  weekdays: number[];
} | {
  type: "monthly";
  dayOfMonth: number;
};

function assertScheduleValid(schedule: ScheduleIn) {
  if (schedule.type === "every_n_days") {
    const n = schedule.intervalDays;
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      throw new Error("Invalid interval");
    }
  }
  if (schedule.type === "weekly") {
    const w = schedule.weekdays;
    if (w.length === 0) throw new Error("Pick at least one weekday");
    for (const d of w) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        throw new Error("Invalid weekday");
      }
    }
  }
  if (schedule.type === "monthly") {
    const d = schedule.dayOfMonth;
    if (!Number.isInteger(d) || d < 1 || d > 31) {
      throw new Error("Invalid day of month");
    }
  }
}

type DurationIn =
  | { kind: "ongoing" }
  | { kind: "temporary"; startDate: string; endDate: string };

function assertDurationValid(duration: DurationIn) {
  if (duration.kind !== "temporary") return;
  const { startDate, endDate } = duration;
  if (!startDate || !endDate) throw new Error("Date range required");
  if (startDate > endDate) throw new Error("End date before start date");
}

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!settings) {
      return { completed: false as const, hasBasicInfo: false as const };
    }
    return {
      completed: !!settings.onboardingCompletedAt,
      hasBasicInfo:
        settings.age != null &&
        settings.sex != null,
      age: settings.age,
      sex: settings.sex,
      conditions: settings.conditions,
      allergies: settings.allergies,
    };
  },
});

export const saveBasicInfo = mutation({
  args: {
    age: v.number(),
    sex: v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("prefer_not_to_say"),
    ),
  },
  handler: async (ctx, { age, sex }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      throw new Error("Invalid age");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!existing) {
      return await ctx.db.insert("userSettings", {
        userId: identity.subject,
        locale: "ar",
        timeZone: DEFAULT_TIME_ZONE,
        age,
        sex,
        alertsEnabled: true,
        defaultSnoozeMinutes: 15,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, { age, sex, updatedAt: now });
    return existing._id;
  },
});

export const saveMedicalContext = mutation({
  args: {
    conditions: v.optional(v.string()),
    allergies: v.optional(v.string()),
  },
  handler: async (ctx, { conditions, allergies }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!existing) {
      return await ctx.db.insert("userSettings", {
        userId: identity.subject,
        locale: "ar",
        timeZone: DEFAULT_TIME_ZONE,
        conditions: conditions?.trim() || undefined,
        allergies: allergies?.trim() || undefined,
        alertsEnabled: true,
        defaultSnoozeMinutes: 15,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, {
      conditions: conditions?.trim() || undefined,
      allergies: allergies?.trim() || undefined,
      updatedAt: now,
    });
    return existing._id;
  },
});

export const completeWithMedications = mutation({
  args: {
    medications: v.array(medicationInput),
  },
  handler: async (ctx, { medications: meds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!settings?.age || !settings.sex) {
      throw new Error("Complete basic info first");
    }
    if (meds.length === 0) {
      throw new Error("Add at least one medication");
    }

    const now = Date.now();

    for (const m of meds) {
      if (!m.name.trim()) throw new Error("Medication name required");
      if (m.reminderTimes.length === 0) {
        throw new Error("At least one reminder time required");
      }
      assertScheduleValid(m.schedule);
      assertDurationValid(m.duration);
    }

    const insertedIds: Id<"medications">[] = [];
    for (const m of meds) {
      const id = await ctx.db.insert("medications", {
        userId: identity.subject,
        name: m.name.trim(),
        dosage: m.dosage?.trim(),
        notes: undefined,
        reminderTimes: m.reminderTimes,
        schedule: m.schedule,
        duration: m.duration,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    await ctx.db.patch(settings._id, {
      onboardingCompletedAt: now,
      updatedAt: now,
    });

    const timeZone = settings.timeZone ?? DEFAULT_TIME_ZONE;
    const pastDosesQueues: {
      medicationId: Id<"medications">;
      name: string;
      slots: { scheduledFor: number }[];
    }[] = [];

    for (const id of insertedIds) {
      const med = await ctx.db.get(id);
      if (!med) continue;
      const slots = await listPastDoseInstantsNeedingConfirmation(
        ctx,
        med,
        timeZone,
        now,
        now,
        null,
      );
      if (slots.length > 0) {
        pastDosesQueues.push({
          medicationId: id,
          name: med.name,
          slots,
        });
      }
    }

    return { ok: true as const, pastDosesQueues };
  },
});
