/** Default IANA zone for new accounts and when settings are not loaded yet. */
export const DEFAULT_TIME_ZONE = "Asia/Riyadh";

/** Common IANA zones for scheduling; users can pick one stored in Convex. */
export const COMMON_TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;
