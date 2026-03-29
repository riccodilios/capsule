import { arSA, enUS } from "@clerk/localizations";

function blankDevelopmentModeStrings(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) blankDevelopmentModeStrings(item);
    return;
  }
  const o = value as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    const v = o[key];
    if (key === "developmentMode" && typeof v === "string") {
      o[key] = "";
    } else {
      blankDevelopmentModeStrings(v);
    }
  }
}

/**
 * Clear dev-only English strings in Clerk localization trees (e.g. UserButton → Manage account).
 * Arabic pack already uses `void 0` for many of these keys.
 */
export function getAuthFlowLocalization(lang: "en" | "ar") {
  if (lang === "ar") {
    return arSA;
  }

  const cloned = JSON.parse(JSON.stringify(enUS)) as typeof enUS;
  blankDevelopmentModeStrings(cloned);
  const dev = cloned.billing?.paymentMethod?.dev;
  if (dev && typeof dev === "object") {
    if (typeof dev.testCardInfo === "string") {
      dev.testCardInfo = "";
    }
  }
  return cloned;
}
