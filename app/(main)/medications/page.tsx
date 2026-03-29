"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useLocale } from "@/lib/i18n/locale-context";
import { GlassPanel } from "@/components/glass-panel";
import { MedicationEditorModal } from "@/components/medications/medication-editor-modal";
import { computeNextDoseUtc } from "@/lib/medication-schedule-client";
import { formatScheduleSummary } from "@/lib/schedule-summary";
import { formatDateTimeShortInZone } from "@/lib/user-time-format";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE } from "@/lib/timezones";

export default function MedicationsPage() {
  const { t, locale, dir } = useLocale();
  const o = t.onboarding;
  const meds = useQuery(api.medications.list, {});
  const settings = useQuery(api.userSettings.get, {});
  const remove = useMutation(api.medications.remove);

  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<Doc<"medications"> | null>(null);

  function openAdd() {
    setModalMode("add");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(m: Doc<"medications">) {
    setModalMode("edit");
    setEditing(m);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  const nextById = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!meds) return map;
    for (const m of meds) {
      map.set(m._id, computeNextDoseUtc(m, timeZone, nowMs));
    }
    return map;
  }, [meds, timeZone, nowMs]);

  async function onDelete(m: Doc<"medications">) {
    if (typeof window === "undefined") return;
    const ok = window.confirm(t.medications.confirmDelete);
    if (!ok) return;
    await remove({ id: m._id });
  }

  if (meds === undefined || settings === undefined) {
    return (
      <p className="text-capsule-text-muted" role="status">
        {t.common.loading}
      </p>
    );
  }

  return (
    <div className="space-y-10" dir={dir}>
      <MedicationEditorModal
        open={modalOpen}
        mode={modalMode}
        timeZone={timeZone}
        initialMed={editing}
        onClose={closeModal}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="capsule-page-title">{t.medications.title}</h1>
        <button
          type="button"
          className="capsule-btn-primary inline-flex min-h-11 shrink-0 items-center gap-2 px-5"
          onClick={openAdd}
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t.medications.add}
        </button>
      </div>

      {meds.length === 0 ? (
        <GlassPanel className="border-[color:rgba(110,135,141,0.35)] bg-white/45">
          <p className="text-center text-sm text-capsule-text-muted">
            {t.medications.empty}
          </p>
        </GlassPanel>
      ) : (
        <ul className="space-y-4">
          {meds.map((m) => {
            const next = nextById.get(m._id) ?? null;
            const nextLabel =
              next === null
                ? t.medications.noNextDose
                : formatDateTimeShortInZone(next, locale, timeZone);
            const scheduleText = formatScheduleSummary(m, locale, o);

            return (
              <li key={m._id}>
                <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <h2 className="text-lg font-semibold tracking-tight text-capsule-text">
                        {m.name}
                      </h2>
                      {m.dosage ? (
                        <p className="text-sm text-capsule-text-muted">
                          {m.dosage}
                        </p>
                      ) : null}
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium text-capsule-text-muted">
                            {t.medications.scheduleLabel}:{" "}
                          </span>
                          <span
                            className={cn(
                              "text-capsule-text",
                              locale === "ar" && "font-arabic",
                            )}
                          >
                            {scheduleText}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-capsule-text-muted">
                            {t.medications.nextDoseLabel}:{" "}
                          </span>
                          <span className="tabular-nums text-capsule-text">
                            {nextLabel}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch"
                      dir={dir}
                    >
                      <button
                        type="button"
                        className="capsule-btn-secondary min-h-10 px-4 text-sm"
                        onClick={() => openEdit(m)}
                      >
                        {t.medications.edit}
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "min-h-10 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition",
                          "border-[color:rgba(201,138,138,0.45)] bg-white/60 text-[#6b4040]",
                          "hover:bg-[var(--capsule-danger-soft)]",
                        )}
                        onClick={() => void onDelete(m)}
                      >
                        {t.medications.delete}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
