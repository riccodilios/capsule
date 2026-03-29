"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { formatClockInZone } from "@/lib/user-time-format";
import { DEFAULT_TIME_ZONE } from "@/lib/timezones";

export type DoseSlot = {
  medicationId: Id<"medications">;
  medicationName: string;
  dosage?: string;
  scheduledFor: number;
  effective: "pending" | "taken_on_time" | "snoozed" | "missed";
  snoozeUntil?: number;
};

export function DoseSlotRow({ slot }: { slot: DoseSlot }) {
  const { t, locale } = useLocale();
  const userSettings = useQuery(api.userSettings.get, {});
  const defaultSnooze = userSettings?.defaultSnoozeMinutes ?? 15;
  const timeZone = userSettings?.timeZone ?? DEFAULT_TIME_ZONE;
  const markTaken = useMutation(api.adherence.markTaken);
  const snoozeDose = useMutation(api.adherence.snooze);
  const markMissed = useMutation(api.adherence.markMissed);

  const timeStr = formatClockInZone(slot.scheduledFor, locale, timeZone);

  const statusLabel = t.dashboard.status[slot.effective];

  const canAct =
    slot.effective === "pending" || slot.effective === "snoozed";

  return (
    <li className="capsule-slot-row flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold text-capsule-text">
            {slot.medicationName}
          </span>
          {slot.dosage ? (
            <span className="text-sm text-capsule-text-muted">{slot.dosage}</span>
          ) : null}
        </div>
        <div className="mt-1.5 text-sm text-capsule-text-muted">{timeStr}</div>
        {slot.effective === "snoozed" && slot.snoozeUntil ? (
          <div className="mt-2 text-xs font-medium text-[color:var(--capsule-warning)]">
            {t.dashboard.snoozeUntil}{" "}
            {formatClockInZone(slot.snoozeUntil, locale, timeZone)}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:items-end">
        <span
          className={cn(
            "inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
            slot.effective === "taken_on_time" && "capsule-chip-success",
            slot.effective === "snoozed" && "capsule-chip-warning",
            slot.effective === "missed" && "capsule-chip-danger",
            slot.effective === "pending" && "capsule-chip-pending",
          )}
        >
          {statusLabel}
        </span>
        {canAct ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="capsule-btn-primary min-h-10 px-4 py-2 text-sm"
              onClick={() =>
                void markTaken({
                  medicationId: slot.medicationId,
                  scheduledFor: slot.scheduledFor,
                })
              }
            >
              {t.dashboard.actions.taken}
            </button>
            <button
              type="button"
              className="capsule-btn-secondary min-h-10 px-4 py-2 text-sm"
              onClick={() =>
                void snoozeDose({
                  medicationId: slot.medicationId,
                  scheduledFor: slot.scheduledFor,
                  minutes: defaultSnooze,
                })
              }
            >
              {t.dashboard.actions.snooze}
            </button>
            {slot.effective === "pending" ? (
              <button
                type="button"
                className="capsule-btn-ghost-danger"
                onClick={() =>
                  void markMissed({
                    medicationId: slot.medicationId,
                    scheduledFor: slot.scheduledFor,
                  })
                }
              >
                {t.dashboard.actions.dismissMissed}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
