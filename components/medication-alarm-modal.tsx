"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/cn";
import { formatClockInZone } from "@/lib/user-time-format";
import { DEFAULT_TIME_ZONE } from "@/lib/timezones";

export type AlarmSlot = {
  medicationId: Id<"medications">;
  medicationName: string;
  dosage?: string;
  scheduledFor: number;
};

export function MedicationAlarmModal({
  slot,
  open,
  onResolved,
}: {
  slot: AlarmSlot | null;
  open: boolean;
  onResolved: () => void;
}) {
  const { t, locale, dir } = useLocale();
  const titleId = useId();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const userSettings = useQuery(api.userSettings.get, open ? {} : "skip");
  const defaultSnooze = userSettings?.defaultSnoozeMinutes ?? 15;
  const timeZone = userSettings?.timeZone ?? DEFAULT_TIME_ZONE;

  const markTaken = useMutation(api.adherence.markTaken);
  const markMissed = useMutation(api.adherence.markMissed);
  const snooze = useMutation(api.adherence.snooze);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSnoozeOpen(false);
  }, [open, slot?.scheduledFor]);

  if (!open || !slot || typeof document === "undefined") {
    return null;
  }

  const active = slot;

  const timeStr = formatClockInZone(
    active.scheduledFor,
    locale,
    timeZone,
  );

  const a = t.dashboard.alarm;

  async function onYes() {
    if (busy) return;
    setBusy(true);
    try {
      await markTaken({
        medicationId: active.medicationId,
        scheduledFor: active.scheduledFor,
      });
      onResolved();
    } finally {
      setBusy(false);
    }
  }

  async function onNo() {
    if (busy) return;
    setBusy(true);
    try {
      await markMissed({
        medicationId: active.medicationId,
        scheduledFor: active.scheduledFor,
      });
      onResolved();
    } finally {
      setBusy(false);
    }
  }

  async function onSnoozeMinutes(minutes: 5 | 10 | 15 | 30) {
    if (busy) return;
    setBusy(true);
    try {
      await snooze({
        medicationId: active.medicationId,
        scheduledFor: active.scheduledFor,
        minutes,
      });
      setSnoozeOpen(false);
      onResolved();
    } finally {
      setBusy(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[rgba(30,45,48,0.48)] backdrop-blur-md"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={dir}
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-xl)] border p-8 shadow-[0_24px_80px_rgba(30,45,48,0.2)]",
          "border-[color:rgba(110,135,141,0.45)] bg-[rgba(255,255,255,0.72)] backdrop-blur-xl",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(93,153,166,0.12),transparent_55%)]" />

        <div className="relative space-y-6 text-center">
          <div>
            <p
              id={titleId}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-capsule-primary"
            >
              {a.title}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-capsule-text sm:text-3xl">
              {active.medicationName}
            </h2>
            {active.dosage ? (
              <p className="mt-2 text-sm text-capsule-text-muted">{active.dosage}</p>
            ) : null}
            <p className="mt-4 text-base font-medium text-capsule-text">
              {a.scheduledPrefix}{" "}
              <time dateTime={new Date(active.scheduledFor).toISOString()}>
                {timeStr}
              </time>
            </p>
          </div>

          <p className="text-lg font-medium leading-snug text-capsule-text">
            {a.question}
          </p>

          {snoozeOpen ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--capsule-border)] bg-white/55 p-4">
              <p className="text-sm font-medium text-capsule-text">
                {a.pickSnooze}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(
                  [
                    [5, a.minutes5],
                    [10, a.minutes10],
                    [15, a.minutes15],
                    [30, a.minutes30],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    disabled={busy}
                    className={cn(
                      "min-h-10 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition",
                      m === defaultSnooze
                        ? "border-capsule-primary bg-[var(--capsule-primary-soft)] text-capsule-text shadow-[0_0_0_2px_rgba(93,153,166,0.25)]"
                        : "capsule-btn-secondary border-transparent",
                    )}
                    onClick={() => void onSnoozeMinutes(m)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="text-xs font-medium text-capsule-text-muted underline-offset-2 hover:underline"
                onClick={() => setSnoozeOpen(false)}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                disabled={busy}
                className="capsule-btn-primary min-h-12 w-full px-6 text-base sm:w-auto"
                onClick={() => void onYes()}
              >
                {a.yes}
              </button>
              <button
                type="button"
                disabled={busy}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] border px-6 text-base font-semibold transition sm:w-auto",
                  "border-[color:rgba(201,138,138,0.55)] bg-[rgba(255,255,255,0.75)] text-[#7a4545]",
                  "hover:bg-[var(--capsule-danger-soft)]",
                )}
                onClick={() => void onNo()}
              >
                {a.no}
              </button>
              <button
                type="button"
                disabled={busy}
                className="capsule-btn-secondary min-h-12 w-full px-6 text-base sm:w-auto"
                onClick={() => setSnoozeOpen(true)}
              >
                {a.snooze}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
