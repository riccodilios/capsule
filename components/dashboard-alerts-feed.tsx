"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/locale-context";
import { GlassPanel } from "@/components/glass-panel";
import { cn } from "@/lib/cn";
import { formatActivityHintInZone } from "@/lib/user-time-format";

export type FeedItem = {
  id: string;
  kind: "upcoming" | "taken" | "missed" | "snoozed";
  medicationName: string;
  /** Present on upcoming rows from Convex; used to collapse to one next dose per medication. */
  medicationId?: string;
  at: number;
  scheduledFor: number;
  snoozeMinutes?: number;
};

function formatRelativeUntil(diffMs: number, locale: Locale): string {
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  if (diffMs < twoHoursMs) {
    const m = Math.max(1, Math.ceil(diffMs / 60_000));
    if (locale === "ar") {
      return m === 1 ? "دقيقة واحدة" : `${m} دقيقة`;
    }
    return m === 1 ? "1 minute" : `${m} minutes`;
  }
  if (diffMs < fortyEightHoursMs) {
    const h = Math.max(1, Math.round(diffMs / 3_600_000));
    if (locale === "ar") {
      return h === 1 ? "ساعة واحدة" : `${h} ساعات`;
    }
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  const d = Math.max(1, Math.ceil(diffMs / 86_400_000));
  if (locale === "ar") {
    return d === 1 ? "يوم واحد" : `${d} أيام`;
  }
  return d === 1 ? "1 day" : `${d} days`;
}

const FEED_PREVIEW_COUNT = 3;

export function DashboardAlertsFeed({
  upcoming,
  activity,
  nowMs,
  timeZone,
  className,
}: {
  upcoming: FeedItem[];
  activity: FeedItem[];
  nowMs: number;
  /** IANA zone from settings — must match scheduling, not the browser default. */
  timeZone: string;
  className?: string;
}) {
  const { t, locale, dir } = useLocale();
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const upcomingDeduped = useMemo(() => {
    const sorted = [...upcoming].sort(
      (a, b) => a.scheduledFor - b.scheduledFor,
    );
    const seen = new Set<string>();
    const out: FeedItem[] = [];
    for (const item of sorted) {
      let key: string;
      if (item.medicationId != null && item.medicationId !== "") {
        key = String(item.medicationId);
      } else if (item.kind === "upcoming" && item.id.startsWith("up-")) {
        const rest = item.id.slice(3);
        const lastDash = rest.lastIndexOf("-");
        key =
          lastDash > 0 ? rest.slice(0, lastDash) : rest || item.id;
      } else {
        key = item.id;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }, [upcoming]);

  const visibleUpcoming =
    upcomingExpanded || upcomingDeduped.length <= FEED_PREVIEW_COUNT
      ? upcomingDeduped
      : upcomingDeduped.slice(0, FEED_PREVIEW_COUNT);
  const visibleActivity =
    activityExpanded || activity.length <= FEED_PREVIEW_COUNT
      ? activity
      : activity.slice(0, FEED_PREVIEW_COUNT);

  return (
    <GlassPanel
      className={cn(
        "min-w-0 border-[color:rgba(110,135,141,0.38)] bg-white/50",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-1" dir={dir}>
        <h2 className="text-lg font-semibold text-capsule-text">
          {t.dashboard.feedSection}
        </h2>
        <p className="text-xs text-capsule-text-muted">
          {locale === "ar"
            ? "معلومات — لا تمنع استخدام التطبيق"
            : "Informational — does not block the rest of the app"}
        </p>
      </div>

      <div className="space-y-8" dir={dir}>
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-capsule-text-muted">
            {t.dashboard.upcomingSection}
          </h3>
          {upcomingDeduped.length === 0 ? (
            <p className="text-sm text-capsule-text-muted">
              {t.dashboard.feedNoUpcomingDose}
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {visibleUpcoming.map((item) => {
                  const relative = formatRelativeUntil(
                    Math.max(0, item.scheduledFor - nowMs),
                    locale,
                  );
                  const text = t.dashboard.feedUpcomingDueIn
                    .replace("{name}", item.medicationName)
                    .replace("{relative}", relative);
                  return (
                    <li key={item.id}>
                      <FeedCard
                        kind="upcoming"
                        text={text}
                        at={item.scheduledFor}
                        timeZone={timeZone}
                      />
                    </li>
                  );
                })}
              </ul>
              {upcomingDeduped.length > FEED_PREVIEW_COUNT ? (
                <button
                  type="button"
                  onClick={() => setUpcomingExpanded((e) => !e)}
                  className="mt-3 text-xs font-medium text-capsule-primary underline-offset-2 hover:underline"
                >
                  {upcomingExpanded
                    ? t.dashboard.feedShowLess
                    : t.dashboard.feedShowMore}
                </button>
              ) : null}
            </>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-capsule-text-muted">
            {t.dashboard.activitySection}
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-capsule-text-muted">
              {t.dashboard.feedEmpty}
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {visibleActivity.map((item) => {
                  let text: string;
                  if (item.kind === "taken") {
                    text = t.dashboard.feedTaken.replace(
                      "{name}",
                      item.medicationName,
                    );
                  } else if (item.kind === "missed") {
                    text = t.dashboard.feedMissed.replace(
                      "{name}",
                      item.medicationName,
                    );
                  } else {
                    const mins = item.snoozeMinutes ?? 15;
                    text = t.dashboard.feedSnoozed
                      .replace("{minutes}", String(mins))
                      .replace("{name}", item.medicationName);
                  }
                  return (
                    <li key={item.id}>
                      <FeedCard
                        kind={item.kind}
                        text={text}
                        at={item.at}
                        timeZone={timeZone}
                      />
                    </li>
                  );
                })}
              </ul>
              {activity.length > FEED_PREVIEW_COUNT ? (
                <button
                  type="button"
                  onClick={() => setActivityExpanded((e) => !e)}
                  className="mt-3 text-xs font-medium text-capsule-primary underline-offset-2 hover:underline"
                >
                  {activityExpanded
                    ? t.dashboard.feedShowLess
                    : t.dashboard.feedShowMore}
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>
    </GlassPanel>
  );
}

function FeedCard({
  kind,
  text,
  at,
  timeZone,
}: {
  kind: FeedItem["kind"];
  text: string;
  at?: number;
  timeZone: string;
}) {
  const { locale } = useLocale();
  const timeHint = useMemo(() => {
    if (at === undefined) return null;
    return formatActivityHintInZone(at, locale, timeZone);
  }, [at, locale, timeZone]);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 backdrop-blur-sm",
        "border-[color:rgba(110,135,141,0.35)] bg-white/55 shadow-sm",
        kind === "upcoming" &&
          "border-[color:rgba(93,153,166,0.4)] shadow-[inset_0_0_0_1px_rgba(93,153,166,0.12)]",
        kind === "taken" &&
          "border-[color:rgba(122,171,140,0.45)] shadow-[inset_0_0_0_1px_rgba(122,171,140,0.15)]",
        kind === "snoozed" &&
          "border-[color:rgba(201,166,110,0.45)] shadow-[inset_0_0_0_1px_rgba(201,166,110,0.18)]",
        kind === "missed" &&
          "border-[color:rgba(201,138,138,0.5)] bg-[rgba(255,248,248,0.55)] shadow-[inset_0_0_0_1px_rgba(201,138,138,0.2)]",
      )}
    >
      <p className="break-words text-sm font-medium text-capsule-text">{text}</p>
      {timeHint ? (
        <p className="mt-1 text-[11px] text-capsule-text-muted">{timeHint}</p>
      ) : null}
    </div>
  );
}
