import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  medicationDuration,
  medicationSchedule,
  reminderTime,
} from "./validators";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    dosage: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminderTimes: v.array(reminderTime),
    schedule: v.optional(medicationSchedule),
    duration: v.optional(medicationDuration),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (args.reminderTimes.length === 0) {
      throw new Error("At least one reminder time is required");
    }
    const now = Date.now();
    return await ctx.db.insert("medications", {
      userId: identity.subject,
      name: args.name.trim(),
      dosage: args.dosage?.trim(),
      notes: args.notes?.trim(),
      reminderTimes: args.reminderTimes,
      schedule: args.schedule ?? { type: "daily" },
      duration: args.duration ?? { kind: "ongoing" },
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("medications"),
    name: v.optional(v.string()),
    dosage: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminderTimes: v.optional(v.array(reminderTime)),
    schedule: v.optional(medicationSchedule),
    duration: v.optional(medicationDuration),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(args.id);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.dosage !== undefined) patch.dosage = args.dosage.trim();
    if (args.notes !== undefined) patch.notes = args.notes.trim();
    if (args.reminderTimes !== undefined) {
      if (args.reminderTimes.length === 0) {
        throw new Error("At least one reminder time is required");
      }
      patch.reminderTimes = args.reminderTimes;
    }
    if (args.schedule !== undefined) patch.schedule = args.schedule;
    if (args.duration !== undefined) patch.duration = args.duration;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const med = await ctx.db.get(id);
    if (!med || med.userId !== identity.subject) {
      throw new Error("Medication not found");
    }
    await ctx.db.patch(id, { active: false, updatedAt: Date.now() });
    return id;
  },
});
