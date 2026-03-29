"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatClockInZone } from "@/lib/user-time-format";
import { cn } from "@/lib/cn";

export type PastDoseStep = {
  medicationId: Id<"medications">;
  medicationName: string;
  scheduledFor: number;
};

export function PastDosesTodayModal({
  open,
  steps,
  timeZone,
  onDone,
}: {
  open: boolean;
  steps: PastDoseStep[];
  timeZone: string;
  onDone: () => void;
}) {
  const { locale, dir, t } = useLocale();
  const titleId = useId();
  const recordPastDoseOutcomes = useMutation(api.adherence.recordPastDoseOutcomes);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answersRef = useRef<
    {
      medicationId: Id<"medications">;
      scheduledFor: number;
      outcome: "taken" | "missed";
    }[]
  >([]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setSaving(false);
    setError(null);
    answersRef.current = [];
  }, [open, steps]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined" || steps.length === 0) {
    return null;
  }

  const step = steps[index];
  const total = steps.length;
  const stepLabel = t.medications.pastDosesStep
    .replace("{current}", String(index + 1))
    .replace("{total}", String(total));

  async function submitGrouped(
    answers: {
      medicationId: Id<"medications">;
      scheduledFor: number;
      outcome: "taken" | "missed";
    }[],
  ) {
    const byMed = new Map<
      Id<"medications">,
      { scheduledFor: number; outcome: "taken" | "missed" }[]
    >();
    for (const a of answers) {
      const list = byMed.get(a.medicationId) ?? [];
      list.push({
        scheduledFor: a.scheduledFor,
        outcome: a.outcome,
      });
      byMed.set(a.medicationId, list);
    }
    for (const [medicationId, entries] of byMed) {
      await recordPastDoseOutcomes({ medicationId, entries });
    }
  }

  async function handleChoice(outcome: "taken" | "missed") {
    if (!step || saving) return;
    setError(null);
    answersRef.current.push({
      medicationId: step.medicationId,
      scheduledFor: step.scheduledFor,
      outcome,
    });

    if (index + 1 < total) {
      setIndex((i) => i + 1);
      return;
    }

    setSaving(true);
    try {
      await submitGrouped(answersRef.current);
      onDone();
    } catch {
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleLater() {
    if (saving) return;
    onDone();
  }

  const timeLine = formatClockInZone(step.scheduledFor, locale, timeZone);

  const modal = (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(30,45,48,0.35)] backdrop-blur-sm"
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
        onClick={() => !saving && void handleLater()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={dir}
        className={cn(
          "relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border p-6 shadow-[0_20px_60px_rgba(93,153,166,0.15)] sm:p-8",
          "border-[color:rgba(110,135,141,0.4)] bg-[rgba(255,255,255,0.78)] backdrop-blur-xl",
        )}
      >
        <p className="text-xs font-medium text-capsule-text-muted">{stepLabel}</p>
        <h2
          id={titleId}
          className="mt-1 text-xl font-semibold tracking-tight text-capsule-text"
        >
          {t.medications.pastDosesTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-capsule-text-muted">
          {t.medications.pastDosesIntro}
        </p>
        <div className="mt-6 rounded-[var(--radius-md)] border border-[color:rgba(110,135,141,0.25)] bg-white/60 px-4 py-4">
          <p className="text-base font-semibold text-capsule-text">
            {step.medicationName}
          </p>
          <p className="mt-1 text-sm text-capsule-text-muted">{timeLine}</p>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-[color:var(--capsule-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="capsule-btn-secondary order-3 sm:order-1"
            disabled={saving}
            onClick={() => void handleLater()}
          >
            {t.medications.pastDosesLater}
          </button>
          <button
            type="button"
            className="capsule-btn-primary order-1 sm:order-2"
            disabled={saving}
            onClick={() => void handleChoice("taken")}
          >
            {saving ? t.common.loading : t.medications.pastDosesTook}
          </button>
          <button
            type="button"
            className="capsule-btn-secondary order-2 border-[color:rgba(110,135,141,0.45)] sm:order-3"
            disabled={saving}
            onClick={() => void handleChoice("missed")}
          >
            {t.medications.pastDosesSkipped}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
