"use node";

import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const sendDueNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const vapidPublicKey = mustEnv("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = mustEnv("VAPID_PRIVATE_KEY");
    const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:support@capsule.app";

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const due = await ctx.runMutation(internal.push.listDuePushes, { now });
    for (const item of due) {
      const payload = JSON.stringify(item.payload);
      try {
        await webpush.sendNotification(
          {
            endpoint: item.subscription.endpoint,
            keys: item.subscription.keys,
          },
          payload,
        );
        await ctx.runMutation(internal.push.markPushSent, {
          userId: item.userId,
          medicationId: item.payload.medicationId as any,
          scheduledFor: item.payload.scheduledFor,
        });
      } catch (err: any) {
        const code = err?.statusCode;
        if (code === 404 || code === 410) {
          await ctx.runMutation(internal.push.removeStaleEndpoint, {
            endpoint: item.subscription.endpoint,
          });
        }
      }
    }
    return null;
  },
});

