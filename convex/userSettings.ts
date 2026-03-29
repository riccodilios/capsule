import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const now = Date.now();
    if (existing) return existing._id;
    return await ctx.db.insert("userSettings", {
      userId: identity.subject,
      locale: "ar",
      timeZone: DEFAULT_TIME_ZONE,
      alertsEnabled: true,
      defaultSnoozeMinutes: 15,
      updatedAt: now,
    });
  },
});

export const updateLocale = mutation({
  args: { locale: v.union(v.literal("en"), v.literal("ar")) },
  handler: async (ctx, { locale }) => {
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
        locale,
        timeZone: DEFAULT_TIME_ZONE,
        alertsEnabled: true,
        defaultSnoozeMinutes: 15,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, { locale, updatedAt: now });
    return existing._id;
  },
});

export const updateTimeZone = mutation({
  args: { timeZone: v.string() },
  handler: async (ctx, { timeZone }) => {
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
        locale: "en",
        timeZone,
        alertsEnabled: true,
        defaultSnoozeMinutes: 15,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, { timeZone, updatedAt: now });
    return existing._id;
  },
});

const sexValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("prefer_not_to_say"),
);

export const updateProfile = mutation({
  args: {
    age: v.optional(v.number()),
    sex: v.optional(sexValidator),
  },
  handler: async (ctx, { age, sex }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (age !== undefined && (!Number.isInteger(age) || age < 1 || age > 120)) {
      throw new Error("Invalid age");
    }
    const patch: Record<string, unknown> = { updatedAt: now };
    if (age !== undefined) patch.age = age;
    if (sex !== undefined) patch.sex = sex;
    if (!existing) {
      return await ctx.db.insert("userSettings", {
        userId: identity.subject,
        locale: "ar",
        timeZone: DEFAULT_TIME_ZONE,
        alertsEnabled: true,
        defaultSnoozeMinutes: 15,
        age: age !== undefined ? age : undefined,
        sex: sex !== undefined ? sex : undefined,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  },
});

