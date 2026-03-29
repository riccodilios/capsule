"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  docToDraft,
  draftToApi,
  newMedDraft,
  validateMedicationDraft,
  type MedicationDraft,
} from "@/lib/medication-draft";
import { MedicationFormFields } from "@/components/medications/medication-form-fields";
import { cn } from "@/lib/cn";

type Mode = "add" | "edit";

export function MedicationEditorModal({
  open,
  mode,
  timeZone,
  initialMed,
  onClose,
}: {
  open: boolean;
  mode: Mode;
  timeZone: string;
  initialMed: import("@/convex/_generated/dataModel").Doc<"medications"> | null;
  onClose: () => void;
}) {
  const { locale, dir, t } = useLocale();
  const o = t.onboarding;
  const medCopy = t.medications;
  const titleId = useId();
  const [draft, setDraft] = useState<MedicationDraft>(() =>
    newMedDraft(timeZone),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = useMutation(api.medications.create);
  const update = useMutation(api.medications.update);

  // Reset form only when opening the modal or switching add/edit target — not when
  // `timeZone` updates (that re-ran this effect and wiped reminder time edits).
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && initialMed) {
      setDraft(docToDraft(initialMed, timeZone));
    } else {
      setDraft(newMedDraft(timeZone));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeZone intentionally omitted
  }, [open, mode, initialMed?._id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function patch(p: Partial<MedicationDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateMedicationDraft(draft, o);
    if (v) {
      setError(locale === "ar" ? v.ar : v.en);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = draftToApi(draft, timeZone);
      if (mode === "add") {
        await create({
          name: payload.name,
          dosage: payload.dosage,
          reminderTimes: payload.reminderTimes,
          schedule: payload.schedule,
          duration: payload.duration,
        });
      } else if (initialMed) {
        await update({
          id: initialMed._id,
          name: payload.name,
          dosage: payload.dosage,
          reminderTimes: payload.reminderTimes,
          schedule: payload.schedule,
          duration: payload.duration,
        });
      }
      onClose();
    } catch {
      setError(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === "add" ? medCopy.modalAddTitle : medCopy.modalEditTitle;

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(30,45,48,0.35)] backdrop-blur-sm"
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={dir}
        className={cn(
          "relative z-10 max-h-[min(92vh,880px)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] border p-6 shadow-[0_20px_60px_rgba(93,153,166,0.15)] sm:p-8",
          "border-[color:rgba(110,135,141,0.4)] bg-[rgba(255,255,255,0.78)] backdrop-blur-xl",
        )}
      >
        <h2
          id={titleId}
          className="text-xl font-semibold tracking-tight text-capsule-text"
        >
          {title}
        </h2>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-6">
          <MedicationFormFields
            draft={draft}
            onChange={patch}
            fieldIdPrefix={`med-modal-${draft.id}`}
            locale={locale}
            o={o}
          />
          {error ? (
            <p className="text-sm text-[color:var(--capsule-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 border-t border-[color:rgba(110,135,141,0.2)] pt-6">
            <button
              type="button"
              className="capsule-btn-secondary"
              disabled={saving}
              onClick={onClose}
            >
              {t.medications.cancel}
            </button>
            <button type="submit" className="capsule-btn-primary" disabled={saving}>
              {saving ? t.common.loading : t.medications.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
