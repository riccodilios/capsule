import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";
import { assertValidPastDoseConfirmation } from "./lib/pastDosesConfirm.js";
import { SNOOZE_MINUTES_DEFAULT } from "./lib/time.js";

function delayOutcomeFields(existing: Doc<"adherenceLogs">) {
  const delayPath =
    existing.status === "snoozed" ||
    existing.wasSnoozed === true ||
    existing.snoozeUntil != null ||
    existing.snoozedAt != null ||
    (existing.snoozeMinutes ?? 0) > 0 ||
    existing.snoozedNextDueAt != null;

  if (!delayPath) {
    return { delayPath: false as const };
  }

  const mins = existing.snoozeMinutes ?? SNOOZE_MINUTES_DEFAULT;
  const snoozeAt = existing.snoozedAt ?? existing.scheduledFor;
  const nextDue =
    existing.snoozeUntil ??
    existing.snoozedNextDueAt ??
    Math.max(existing.scheduledFor, snoozeAt + mins * 60 * 1000);

  return {
    delayPath: true as const,
    wasSnoozed: true as const,
    snoozedAt: snoozeAt,
    snoozeMinutes: mins,
    snoozedNextDueAt: nextDue,
  };
}

export const markTaken = mutation({
  args: {
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, { medicationId, scheduledFor }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(medicationId);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", identity.subject)
          .eq("medicationId", medicationId)
          .eq("scheduledFor", scheduledFor),
      )
      .unique();
    if (existing) {
      const d = delayOutcomeFields(existing);
      if (d.delayPath) {
        await ctx.db.patch(existing._id, {
          status: "taken_on_time",
          takenAt: now,
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: true,
          snoozedAt: d.snoozedAt,
          snoozeMinutes: d.snoozeMinutes,
          snoozedNextDueAt: d.snoozedNextDueAt,
        });
      } else {
        await ctx.db.patch(existing._id, {
          status: "taken_on_time",
          takenAt: now,
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: false,
        });
      }
      return existing._id;
    }
    return await ctx.db.insert("adherenceLogs", {
      userId: identity.subject,
      medicationId,
      scheduledFor,
      status: "taken_on_time",
      takenAt: now,
      updatedAt: now,
    });
  },
});

export const snooze = mutation({
  args: {
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
    minutes: v.optional(v.number()),
  },
  handler: async (ctx, { medicationId, scheduledFor, minutes }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(medicationId);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    const m = minutes ?? SNOOZE_MINUTES_DEFAULT;
    if (![5, 10, 15, 30].includes(m)) {
      throw new Error("Snooze minutes must be 5, 10, 15, or 30");
    }
    const now = Date.now();
    const snoozeUntil = now + m * 60 * 1000;
    const existing = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", identity.subject)
          .eq("medicationId", medicationId)
          .eq("scheduledFor", scheduledFor),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "snoozed",
        snoozeUntil,
        snoozedNextDueAt: snoozeUntil,
        snoozeMinutes: m,
        wasSnoozed: true,
        ...(existing.snoozedAt == null ? { snoozedAt: now } : {}),
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("adherenceLogs", {
      userId: identity.subject,
      medicationId,
      scheduledFor,
      status: "snoozed",
      snoozeUntil,
      snoozedNextDueAt: snoozeUntil,
      snoozeMinutes: m,
      snoozedAt: now,
      wasSnoozed: true,
      updatedAt: now,
    });
  },
});

/**
 * Backfill taken/missed for same-day reminder times that fell before tracking started
 * (e.g. user added medication at night; morning/noon need explicit confirmation).
 */
export const recordPastDoseOutcomes = mutation({
  args: {
    medicationId: v.id("medications"),
    entries: v.array(
      v.object({
        scheduledFor: v.number(),
        outcome: v.union(v.literal("taken"), v.literal("missed")),
      }),
    ),
  },
  handler: async (ctx, { medicationId, entries }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(medicationId);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
    const now = Date.now();

    for (const { scheduledFor, outcome } of entries) {
      assertValidPastDoseConfirmation(
        med,
        timeZone,
        settings?.onboardingCompletedAt,
        now,
        scheduledFor,
      );
      const existing = await ctx.db
        .query("adherenceLogs")
        .withIndex("by_lookup", (q) =>
          q
            .eq("userId", identity.subject)
            .eq("medicationId", medicationId)
            .eq("scheduledFor", scheduledFor),
        )
        .unique();
      if (existing) continue;

      if (outcome === "taken") {
        await ctx.db.insert("adherenceLogs", {
          userId: identity.subject,
          medicationId,
          scheduledFor,
          status: "taken_on_time",
          takenAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("adherenceLogs", {
          userId: identity.subject,
          medicationId,
          scheduledFor,
          status: "missed",
          updatedAt: now,
        });
      }
    }
  },
});

export const markMissed = mutation({
  args: {
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, { medicationId, scheduledFor }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(medicationId);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", identity.subject)
          .eq("medicationId", medicationId)
          .eq("scheduledFor", scheduledFor),
      )
      .unique();
    if (existing) {
      const d = delayOutcomeFields(existing);
      if (d.delayPath) {
        await ctx.db.patch(existing._id, {
          status: "missed",
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: true,
          snoozedAt: d.snoozedAt,
          snoozeMinutes: d.snoozeMinutes,
          snoozedNextDueAt: d.snoozedNextDueAt,
        });
      } else {
        await ctx.db.patch(existing._id, {
          status: "missed",
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: false,
        });
      }
      return existing._id;
    }
    return await ctx.db.insert("adherenceLogs", {
      userId: identity.subject,
      medicationId,
      scheduledFor,
      status: "missed",
      updatedAt: now,
    });
  },
});
