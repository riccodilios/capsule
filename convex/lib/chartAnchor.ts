import type { Doc } from "../_generated/dataModel";

/**
 * When adherence charts and “first month” should start.
 * `userSettings._creationTime` is often set at bootstrap (before onboarding), so we prefer
 * `onboardingCompletedAt`, then earliest medication, then document creation.
 */
export function adherenceChartAnchorMs(
  settings: Doc<"userSettings"> | null,
  medicationsAll: Doc<"medications">[],
  fallbackNow: number,
): number {
  if (settings?.onboardingCompletedAt != null) {
    return settings.onboardingCompletedAt;
  }
  const medStarts = medicationsAll.map((m) => m.createdAt);
  if (medStarts.length > 0) {
    return Math.min(...medStarts);
  }
  return settings?._creationTime ?? fallbackNow;
}
