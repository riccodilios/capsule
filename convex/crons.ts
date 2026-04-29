import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check every minute for due doses and send push notifications.
crons.interval(
  "send due medication push notifications",
  { minutes: 1 },
  internal.pushSend.sendDueNotifications,
  {},
);

export default crons;

