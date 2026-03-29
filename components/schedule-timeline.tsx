"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { formatClockInZone } from "@/lib/user-time-format";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/cn";

type DashboardT = Dictionary["dashboard"];

export type TimelineSlot = {
  medicationId: Id<"medications">;
  medicationName: string;
  dosage?: string;
  scheduledFor: number;
  effective: "pending" | "taken_on_time" | "snoozed" | "missed";
  snoozeUntil?: number;
  /** Present when the user snoozed at least once before marking taken. */
  snoozedAt?: number;
  /** Last snooze duration (minutes); used if `snoozedAt` missing on older rows. */
  snoozeMinutes?: number;
  /**
   * Last “next alert after snooze” time; kept after take/miss for the outcome row clock.
   */
  snoozedNextDueAt?: number;
  /** Server flag: user snoozed this dose at least once (survives take/miss). */
  wasSnoozed?: boolean;
  takenAt?: number;
};

/** User delayed this dose at least once (persisted for history after take/miss). */
function hadDelayHistory(slot: TimelineSlot): boolean {
  return (
    slot.wasSnoozed === true ||
    slot.snoozedAt != null ||
    (slot.snoozeMinutes != null && slot.snoozeMinutes > 0) ||
    slot.snoozedNextDueAt != null
  );
}

function hasSnoozeStory(slot: TimelineSlot): boolean {
  return slot.effective === "snoozed" || hadDelayHistory(slot);
}

function snoozeEventMs(slot: TimelineSlot): number {
  return slot.snoozedAt ?? slot.scheduledFor;
}

function dueAfterSnoozeMs(slot: TimelineSlot): number {
  if (slot.snoozedNextDueAt != null) return slot.snoozedNextDueAt;
  if (slot.snoozeUntil != null) return slot.snoozeUntil;
  const base = slot.snoozedAt ?? slot.scheduledFor;
  const mins = slot.snoozeMinutes ?? 15;
  return Math.max(slot.scheduledFor, base + mins * 60 * 1000);
}

type ExpandedRow =
  | {
      type: "single";
      slot: TimelineSlot;
      sortTime: number;
      key: string;
    }
  | {
      type: "pair_snooze";
      slot: TimelineSlot;
      sortTime: number;
      key: string;
      at: number;
    }
  | {
      type: "pair_due";
      slot: TimelineSlot;
      sortTime: number;
      key: string;
      at: number;
    };

function expandSlots(slots: TimelineSlot[]): ExpandedRow[] {
  const out: ExpandedRow[] = [];
  for (const slot of slots) {
    if (!hasSnoozeStory(slot)) {
      out.push({
        type: "single",
        slot,
        sortTime: slot.scheduledFor,
        key: `${slot.medicationId}-${slot.scheduledFor}`,
      });
      continue;
    }
    const snoozeAt = snoozeEventMs(slot);
    const mins = Math.max(1, slot.snoozeMinutes ?? 15);
    let dueAt = dueAfterSnoozeMs(slot);
    if (dueAt <= snoozeAt) {
      dueAt = snoozeAt + mins * 60 * 1000;
    }
    out.push({
      type: "pair_snooze",
      slot,
      sortTime: snoozeAt,
      key: `${slot.medicationId}-${slot.scheduledFor}-snooze`,
      at: snoozeAt,
    });
    out.push({
      type: "pair_due",
      slot,
      sortTime: dueAt,
      key: `${slot.medicationId}-${slot.scheduledFor}-due`,
      at: dueAt,
    });
  }
  out.sort((a, b) => a.sortTime - b.sortTime);
  return out;
}

export function ScheduleTimeline({
  slots,
  timeZone,
  nowMs = Date.now(),
}: {
  slots: TimelineSlot[];
  timeZone: string;
  /** Wall clock for “next alert” / pending transitions; should match dashboard. */
  nowMs?: number;
}) {
  const { t, locale, dir } = useLocale();

  const rows = useMemo(() => expandSlots(slots), [slots]);

  if (slots.length === 0) {
    return (
      <p className="text-sm text-capsule-text-muted" dir={dir}>
        {t.dashboard.empty}
      </p>
    );
  }

  return (
    <ul className="relative space-y-0 border-s border-[color:rgba(110,135,141,0.35)] ps-6" dir={dir}>
      <span
        className="absolute start-0 top-2 bottom-2 w-px bg-gradient-to-b from-capsule-primary/25 via-[var(--capsule-border)] to-transparent"
        aria-hidden
      />
      {rows.map((row) => (
        <ScheduleRow
          key={row.key}
          row={row}
          locale={locale}
          timeZone={timeZone}
          t={t.dashboard}
          nowMs={nowMs}
        />
      ))}
    </ul>
  );
}

function ScheduleRow({
  row,
  locale,
  timeZone,
  t,
  nowMs,
}: {
  row: ExpandedRow;
  locale: Locale;
  timeZone: string;
  t: DashboardT;
  nowMs: number;
}) {
  if (row.type === "single") {
    return (
      <SingleSlotRow
        slot={row.slot}
        locale={locale}
        timeZone={timeZone}
        t={t}
      />
    );
  }
  if (row.type === "pair_snooze") {
    const timeStr = formatClockInZone(row.at, locale, timeZone);
    return (
      <li className="relative pb-6 last:pb-0">
        <span
          className="absolute -start-[29px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[color:var(--capsule-warning)] shadow-sm"
          aria-hidden
        />
        <div className="min-w-0 rounded-[var(--radius-lg)] border border-[color:rgba(110,135,141,0.32)] bg-white/50 px-3 py-3 backdrop-blur-sm sm:px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="min-w-0 flex-1 break-words font-semibold text-capsule-text">
              {row.slot.medicationName}
            </span>
            <time
              className="shrink-0 text-sm tabular-nums text-capsule-text-muted"
              dateTime={new Date(row.at).toISOString()}
            >
              {timeStr}
            </time>
          </div>
          {row.slot.dosage ? (
            <p className="mt-1 break-words text-sm text-capsule-text-muted">
              {row.slot.dosage}
            </p>
          ) : null}
          <div className="mt-2">
            <span className="inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] capsule-chip-warning">
              {t.stats.snoozed}
            </span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <PairDueRow
      slot={row.slot}
      at={row.at}
      locale={locale}
      timeZone={timeZone}
      t={t}
      nowMs={nowMs}
    />
  );
}

function PairDueRow({
  slot,
  at,
  locale,
  timeZone,
  t,
  nowMs,
}: {
  slot: TimelineSlot;
  at: number;
  locale: Locale;
  timeZone: string;
  t: DashboardT;
  nowMs: number;
}) {
  const timeStr = formatClockInZone(at, locale, timeZone);
  const takenAtMs = slot.takenAt;
  const takenAfterSnooze =
    slot.effective === "taken_on_time" &&
    takenAtMs != null &&
    hadDelayHistory(slot);

  const takenClock =
    takenAtMs != null
      ? formatClockInZone(takenAtMs, locale, timeZone)
      : null;

  const waitingForNextAlert =
    slot.effective === "snoozed" &&
    slot.snoozeUntil != null &&
    nowMs < slot.snoozeUntil;

  const tone = waitingForNextAlert
    ? "primary"
    : takenAfterSnooze
      ? "warning"
      : slot.effective === "taken_on_time"
        ? "success"
        : slot.effective === "missed"
          ? "danger"
          : slot.effective === "snoozed"
            ? "warning"
            : "primary";

  const chipLabel = waitingForNextAlert
    ? t.timelineNextAlert
    : takenAfterSnooze
      ? t.status.taken_after_delay
      : t.status[slot.effective];

  const chipClass = waitingForNextAlert
    ? "capsule-chip-pending"
    : takenAfterSnooze
      ? "capsule-chip-warning"
      : slot.effective === "taken_on_time"
        ? "capsule-chip-success"
        : slot.effective === "missed"
          ? "capsule-chip-danger"
          : slot.effective === "pending"
            ? "capsule-chip-pending"
            : "capsule-chip-warning";

  return (
    <li className="relative pb-6 last:pb-0">
      <span
        className={cn(
          "absolute -start-[29px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-sm",
          tone === "success" && "bg-[color:var(--capsule-success)]",
          tone === "danger" && "bg-[color:var(--capsule-danger)]",
          tone === "warning" && "bg-[color:var(--capsule-warning)]",
          tone === "primary" && "bg-capsule-primary",
        )}
        aria-hidden
      />
      <div className="min-w-0 rounded-[var(--radius-lg)] border border-[color:rgba(110,135,141,0.32)] bg-white/50 px-3 py-3 backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="min-w-0 flex-1 break-words font-semibold text-capsule-text">
            {slot.medicationName}
          </span>
          <time
            className="shrink-0 text-sm tabular-nums text-capsule-text-muted"
            dateTime={new Date(at).toISOString()}
          >
            {timeStr}
          </time>
        </div>
        {slot.dosage ? (
          <p className="mt-1 break-words text-sm text-capsule-text-muted">
            {slot.dosage}
          </p>
        ) : null}
        <div className="mt-2">
          <span
            className={cn(
              "inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
              chipClass,
            )}
          >
            {chipLabel}
          </span>
        </div>
        {takenAfterSnooze && takenClock ? (
          <p className="mt-2 text-xs leading-relaxed text-capsule-text">
            <span className="font-medium text-capsule-text">
              {t.timelineTakenPrefix}
            </span>{" "}
            <span className="tabular-nums text-capsule-text-muted">
              {takenClock}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

function SingleSlotRow({
  slot,
  locale,
  timeZone,
  t,
}: {
  slot: TimelineSlot;
  locale: Locale;
  timeZone: string;
  t: DashboardT;
}) {
  const timeStr = formatClockInZone(slot.scheduledFor, locale, timeZone);
  const takenAtMs = slot.takenAt;
  const takenAfterSnooze =
    slot.effective === "taken_on_time" &&
    takenAtMs != null &&
    hadDelayHistory(slot);

  let delayedAtMs: number | undefined = slot.snoozedAt ?? undefined;
  if (
    delayedAtMs == null &&
    takenAfterSnooze &&
    takenAtMs != null &&
    slot.snoozeMinutes != null &&
    slot.snoozeMinutes > 0
  ) {
    delayedAtMs = Math.max(
      slot.scheduledFor,
      takenAtMs - slot.snoozeMinutes * 60 * 1000,
    );
  }

  const tone = takenAfterSnooze
    ? "warning"
    : slot.effective === "taken_on_time"
      ? "success"
      : slot.effective === "missed"
        ? "danger"
        : slot.effective === "snoozed"
          ? "warning"
          : "primary";

  const delayedClock =
    delayedAtMs != null
      ? formatClockInZone(delayedAtMs, locale, timeZone)
      : null;
  const takenClock =
    takenAtMs != null
      ? formatClockInZone(takenAtMs, locale, timeZone)
      : null;

  return (
    <li className="relative pb-6 last:pb-0">
      <span
        className={cn(
          "absolute -start-[29px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-sm",
          tone === "success" && "bg-[color:var(--capsule-success)]",
          tone === "danger" && "bg-[color:var(--capsule-danger)]",
          tone === "warning" && "bg-[color:var(--capsule-warning)]",
          tone === "primary" && "bg-capsule-primary",
        )}
        aria-hidden
      />
      <div className="min-w-0 rounded-[var(--radius-lg)] border border-[color:rgba(110,135,141,0.32)] bg-white/50 px-3 py-3 backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="min-w-0 flex-1 break-words font-semibold text-capsule-text">
            {slot.medicationName}
          </span>
          <time
            className="shrink-0 text-sm tabular-nums text-capsule-text-muted"
            dateTime={new Date(slot.scheduledFor).toISOString()}
          >
            {timeStr}
          </time>
        </div>
        {slot.dosage ? (
          <p className="mt-1 break-words text-sm text-capsule-text-muted">
            {slot.dosage}
          </p>
        ) : null}
        <div className="mt-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
              takenAfterSnooze && "capsule-chip-warning",
              !takenAfterSnooze &&
                slot.effective === "taken_on_time" &&
                "capsule-chip-success",
              slot.effective === "missed" && "capsule-chip-danger",
              slot.effective === "snoozed" && "capsule-chip-warning",
              slot.effective === "pending" && "capsule-chip-pending",
            )}
          >
            {takenAfterSnooze
              ? t.status.taken_after_delay
              : t.status[slot.effective]}
          </span>
        </div>
        {takenAfterSnooze && takenClock ? (
          <p className="mt-2 text-xs leading-relaxed text-capsule-text">
            {delayedClock ? (
              <>
                <span className="font-medium text-capsule-text">
                  {t.timelineDelayedPrefix}
                </span>{" "}
                <span className="tabular-nums text-capsule-text-muted">
                  {delayedClock}
                </span>
                <span
                  className="mx-1.5 text-capsule-text-muted"
                  aria-hidden
                >
                  ·
                </span>
              </>
            ) : null}
            <span className="font-medium text-capsule-text">
              {t.timelineTakenPrefix}
            </span>{" "}
            <span className="tabular-nums text-capsule-text-muted">
              {takenClock}
            </span>
          </p>
        ) : null}
        {slot.effective === "snoozed" && slot.snoozeUntil ? (
          <p className="mt-2 text-xs text-[color:var(--capsule-warning)]">
            {t.snoozeUntil}{" "}
            {formatClockInZone(slot.snoozeUntil, locale, timeZone)}
          </p>
        ) : null}
      </div>
    </li>
  );
}
