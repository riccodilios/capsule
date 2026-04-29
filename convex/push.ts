import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { DEFAULT_TIME_ZONE } from "../lib/timezones";
import { buildSlotsForDay } from "./lib/monthlyAggregation.js";
import { getEffectiveStatus } from "./lib/status.js";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const subscriptionValidator = v.object({
  endpoint: v.string(),
  expirationTime: v.optional(v.union(v.number(), v.null())),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
});

export const setNotificationsEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    const now = Date.now();
    if (!settings) {
      await ctx.db.insert("userSettings", {
        userId: identity.subject,
        locale: "ar",
        timeZone: DEFAULT_TIME_ZONE,
        alertsEnabled: true,
        notificationsEnabled: enabled,
        defaultSnoozeMinutes: 15,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.patch(settings._id, { notificationsEnabled: enabled, updatedAt: now });
    return null;
  },
});

export const upsertSubscription = mutation({
  args: {
    subscription: subscriptionValidator,
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { subscription, userAgent }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", subscription.endpoint))
      .unique();
    const row = {
      userId: identity.subject,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime:
        subscription.expirationTime == null ? undefined : subscription.expirationTime,
      userAgent,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
      return null;
    }
    await ctx.db.insert("pushSubscriptions", { ...row, createdAt: now });
    return null;
  },
});

export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing && existing.userId === identity.subject) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const removeStaleEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export type DuePush = {
  userId: string;
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  payload: {
    title: string;
    body: string;
    lang: "ar" | "en";
    icon: string;
    badge: string;
    scheduledFor: number;
    notifyAt: number;
    medicationId: string;
    actionEndpoint: string;
    actionToken: string;
    actions: { action: "taken" | "missed" | "snooze15"; title: string }[];
  };
};

const SEND_WINDOW_MS = 5 * 60 * 1000;

export const markPushSent = internalMutation({
  args: {
    userId: v.string(),
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
    notifyAt: v.number(),
  },
  handler: async (ctx, { userId, medicationId, scheduledFor, notifyAt }) => {
    const existing = await ctx.db
      .query("pushNotificationsSentV2")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", userId)
          .eq("medicationId", medicationId)
          .eq("notifyAt", notifyAt),
      )
      .unique();
    if (existing) return null;
    await ctx.db.insert("pushNotificationsSentV2", {
      userId,
      medicationId,
      scheduledFor,
      notifyAt,
      sentAt: Date.now(),
    });
    return null;
  },
});

export const createActionToken = internalMutation({
  args: {
    userId: v.string(),
    medicationId: v.id("medications"),
    scheduledFor: v.number(),
    notifyAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args): Promise<string> => {
    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await ctx.db.insert("pushActionTokens", {
      token,
      userId: args.userId,
      medicationId: args.medicationId,
      scheduledFor: args.scheduledFor,
      notifyAt: args.notifyAt,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return token;
  },
});

export const applyActionToken = internalMutation({
  args: {
    token: v.string(),
    action: v.union(v.literal("taken"), v.literal("missed"), v.literal("snooze15")),
  },
  handler: async (ctx, { token, action }) => {
    const row = await ctx.db
      .query("pushActionTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!row) throw new Error("Invalid token");
    const now = Date.now();
    if (row.usedAt != null) throw new Error("Token used");
    if (row.expiresAt < now) throw new Error("Expired");

    const med = await ctx.db.get(row.medicationId);
    if (!med || med.userId !== row.userId) throw new Error("Medication not found");

    const existing = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_lookup", (q) =>
        q
          .eq("userId", row.userId)
          .eq("medicationId", row.medicationId)
          .eq("scheduledFor", row.scheduledFor),
      )
      .unique();

    if (action === "taken") {
      if (existing) {
        await ctx.db.patch(existing._id, {
          status: "taken_on_time",
          takenAt: now,
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: existing.wasSnoozed ?? false,
        });
      } else {
        await ctx.db.insert("adherenceLogs", {
          userId: row.userId,
          medicationId: row.medicationId,
          scheduledFor: row.scheduledFor,
          status: "taken_on_time",
          takenAt: now,
          updatedAt: now,
        });
      }
    } else if (action === "missed") {
      if (existing) {
        await ctx.db.patch(existing._id, {
          status: "missed",
          snoozeUntil: undefined,
          updatedAt: now,
          wasSnoozed: existing.wasSnoozed ?? false,
        });
      } else {
        await ctx.db.insert("adherenceLogs", {
          userId: row.userId,
          medicationId: row.medicationId,
          scheduledFor: row.scheduledFor,
          status: "missed",
          updatedAt: now,
        });
      }
    } else {
      const minutes = 15;
      const snoozeUntil = now + minutes * 60 * 1000;
      if (existing) {
        await ctx.db.patch(existing._id, {
          status: "snoozed",
          snoozeUntil,
          snoozedNextDueAt: snoozeUntil,
          snoozeMinutes: minutes,
          wasSnoozed: true,
          ...(existing.snoozedAt == null ? { snoozedAt: now } : {}),
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("adherenceLogs", {
          userId: row.userId,
          medicationId: row.medicationId,
          scheduledFor: row.scheduledFor,
          status: "snoozed",
          snoozeUntil,
          snoozedNextDueAt: snoozeUntil,
          snoozeMinutes: minutes,
          snoozedAt: now,
          wasSnoozed: true,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(row._id, { usedAt: now });
    return null;
  },
});

export const listDuePushes = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, { now }): Promise<DuePush[]> => {
    const out: DuePush[] = [];
    // Enabled users only.
    const enabled = await ctx.db
      .query("userSettings")
      .withIndex("by_notificationsEnabled_and_userId", (q) =>
        q.eq("notificationsEnabled", true),
      )
      .take(200);

    for (const settings of enabled) {
      const userId = settings.userId;
      const timeZone = settings.timeZone ?? DEFAULT_TIME_ZONE;
      const locale = settings.locale ?? "ar";

      const subs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5);
      const sub = subs[0];
      if (!sub) continue;

      const dayISO = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
      const dayStart = fromZonedTime(`${dayISO}T00:00:00`, timeZone).getTime();
      const dayEnd = fromZonedTime(`${dayISO}T23:59:59`, timeZone).getTime() + 1;

      const medsAll = await ctx.db
        .query("medications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const meds = medsAll.filter((m) => m.active);

      if (meds.length === 0) continue;

      const logs = await ctx.db
        .query("adherenceLogs")
        .withIndex("by_user_scheduled", (q) =>
          q.eq("userId", userId).gte("scheduledFor", dayStart),
        )
        .filter((q) => q.lt(q.field("scheduledFor"), dayEnd))
        .collect();
      const logByKey = new Map<string, (typeof logs)[number]>();
      for (const l of logs) logByKey.set(`${l.medicationId}_${l.scheduledFor}`, l);

      const slots = buildSlotsForDay(dayISO, meds, logByKey, now, timeZone, {
        userOnboardingCompletedAt: settings.onboardingCompletedAt,
      });

      for (const s of slots) {
        // Determine when to notify: original scheduled time or snoozed due time.
        const notifyAt =
          s.log?.status === "snoozed" && typeof s.log.snoozedNextDueAt === "number"
            ? s.log.snoozedNextDueAt
            : s.scheduledFor;

        // Only send close to notifyAt (within window), and only if still pending.
        if (notifyAt > now) continue;
        if (now - notifyAt > SEND_WINDOW_MS) continue;

        const effective = getEffectiveStatus(s.log, now, s.scheduledFor);
        if (effective !== "pending") continue;

        const already = await ctx.db
          .query("pushNotificationsSentV2")
          .withIndex("by_lookup", (q) =>
            q
              .eq("userId", userId)
              .eq("medicationId", s.medicationId as Id<"medications">)
              .eq("notifyAt", notifyAt),
          )
          .unique();
        if (already) continue;

        const hhmm = formatInTimeZone(s.scheduledFor, timeZone, "HH:mm");
        const title = locale === "ar" ? "تذكير الدواء" : "Medication reminder";
        const body =
          locale === "ar"
            ? `${s.medicationName} • ${hhmm}`
            : `${s.medicationName} • ${hhmm}`;

        const actionToken =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto as any).randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await ctx.db.insert("pushActionTokens", {
          token: actionToken,
          userId,
          medicationId: s.medicationId as Id<"medications">,
          scheduledFor: s.scheduledFor,
          notifyAt,
          expiresAt: now + 30 * 60 * 1000,
          createdAt: now,
        });

        out.push({
          userId,
          subscription: {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload: {
            title,
            body,
            lang: locale,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            scheduledFor: s.scheduledFor,
            notifyAt,
            medicationId: String(s.medicationId),
            actionEndpoint: "/push/action",
            actionToken: actionToken as any,
            actions:
              locale === "ar"
                ? [
                    { action: "taken", title: "أخذته" },
                    { action: "missed", title: "لم آخذه" },
                    { action: "snooze15", title: "غفوة ١٥ د" },
                  ]
                : [
                    { action: "taken", title: "Taken" },
                    { action: "missed", title: "Didn't" },
                    { action: "snooze15", title: "Snooze 15m" },
                  ],
          },
        });
      }
    }

    return out;
  },
});

