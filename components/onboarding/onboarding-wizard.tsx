"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Bilingual, Dictionary } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  draftToApi,
  newMedDraft,
  validateMedicationDraft,
  type MedicationDraft,
} from "@/lib/medication-draft";
import { GlassPanel } from "@/components/glass-panel";
import { BilingualFieldLabel, BilingualLabel } from "@/components/onboarding/bilingual-label";
import { MedicationFormFields } from "@/components/medications/medication-form-fields";
import {
  PastDosesTodayModal,
  type PastDoseStep,
} from "@/components/medications/past-doses-today-modal";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE } from "@/lib/timezones";

type Sex = "male" | "female" | "prefer_not_to_say";

function validateMeds(
  drafts: MedicationDraft[],
  o: Dictionary["onboarding"],
): Bilingual | null {
  for (const d of drafts) {
    const err = validateMedicationDraft(d, o);
    if (err) return err;
  }
  return null;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { locale, dir, t } = useLocale();
  const o = t.onboarding;

  const status = useQuery(api.onboarding.getStatus, {});
  const settings = useQuery(api.userSettings.get, {});
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;

  const saveBasicInfo = useMutation(api.onboarding.saveBasicInfo);
  const saveMedicalContext = useMutation(api.onboarding.saveMedicalContext);
  const completeWithMedications = useMutation(
    api.onboarding.completeWithMedications,
  );

  const [pastOnboardingSteps, setPastOnboardingSteps] = useState<
    PastDoseStep[] | null
  >(null);
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [meds, setMeds] = useState<MedicationDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<Bilingual | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (status?.completed) {
      router.replace("/dashboard");
    }
  }, [status?.completed, router]);

  useEffect(() => {
    if (meds.length === 0 && timeZone) {
      setMeds([newMedDraft(timeZone)]);
    }
  }, [timeZone, meds.length]);

  useEffect(() => {
    if (!status || status.completed || hydrated.current) return;
    hydrated.current = true;
    if (status.age != null) setAge(String(status.age));
    if (status.sex) setSex(status.sex);
    if (status.conditions) setConditions(status.conditions);
    if (status.allergies) setAllergies(status.allergies);
  }, [status]);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  const showError = useCallback(
    (pair: Bilingual) => {
      setFormError(pair);
    },
    [],
  );

  const errorLine = formError
    ? locale === "ar"
      ? formError.ar
      : formError.en
    : null;

  async function onStep1Next() {
    setFormError(null);
    const n = Number.parseInt(age, 10);
    if (!Number.isFinite(n) || n < 1 || n > 120) {
      showError(o.validationAge);
      return;
    }
    if (!sex) {
      showError(o.validationSex);
      return;
    }
    setBusy(true);
    try {
      await saveBasicInfo({ age: n, sex: sex as Sex });
      setStep(2);
    } catch {
      showError({ en: t.common.error, ar: t.common.error });
    } finally {
      setBusy(false);
    }
  }

  async function onStep2Next() {
    setFormError(null);
    setBusy(true);
    try {
      await saveMedicalContext({
        conditions: conditions.trim() || undefined,
        allergies: allergies.trim() || undefined,
      });
      setStep(3);
    } catch {
      showError({ en: t.common.error, ar: t.common.error });
    } finally {
      setBusy(false);
    }
  }

  async function onFinish() {
    setFormError(null);
    if (meds.length === 0) {
      showError(o.validationAtLeastOneMed);
      return;
    }
    const err = validateMeds(meds, o);
    if (err) {
      showError(err);
      return;
    }
    setBusy(true);
    try {
      const result = await completeWithMedications({
        medications: meds.map((d) => draftToApi(d, timeZone)),
      });
      const queues = result.pastDosesQueues ?? [];
      if (queues.length > 0) {
        const steps: PastDoseStep[] = [];
        for (const q of queues) {
          for (const s of q.slots) {
            steps.push({
              medicationId: q.medicationId,
              medicationName: q.name,
              scheduledFor: s.scheduledFor,
            });
          }
        }
        steps.sort((a, b) => a.scheduledFor - b.scheduledFor);
        setPastOnboardingSteps(steps);
        return;
      }
      router.replace("/dashboard");
    } catch {
      showError({ en: t.common.error, ar: t.common.error });
    } finally {
      setBusy(false);
    }
  }

  function onPastOnboardingDone() {
    setPastOnboardingSteps(null);
    router.replace("/dashboard");
  }

  function updateMed(id: string, patch: Partial<MedicationDraft>) {
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  if (status === undefined) {
    return (
      <p className="text-capsule-text-muted" role="status">
        {t.common.loading}
      </p>
    );
  }

  if (status === null) {
    return (
      <p className="text-capsule-text-muted" role="alert">
        {t.common.error}
      </p>
    );
  }

  if (status.completed) {
    return null;
  }

  return (
    <>
      <PastDosesTodayModal
        open={
          pastOnboardingSteps != null && pastOnboardingSteps.length > 0
        }
        steps={pastOnboardingSteps ?? []}
        timeZone={timeZone}
        onDone={onPastOnboardingDone}
      />
    <div className="mx-auto max-w-xl space-y-10" dir={dir}>
      <header className="space-y-3 text-center sm:text-start">
        <BilingualLabel pair={o.pageTitle} locale={locale} as="h1" />
        <BilingualLabel
          pair={o.pageSubtitle}
          locale={locale}
          as="p"
          className="!space-y-1"
        />
      </header>

      <div className="space-y-3">
        <div
          className="capsule-progress-track h-2 overflow-hidden rounded-full p-0"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
        >
          <div
            className="h-full rounded-full bg-[color:rgba(93,153,166,0.55)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-capsule-text-muted sm:text-start">
          <span className="inline-block" dir={locale === "ar" ? "rtl" : "ltr"}>
            {locale === "ar" ? (
              <>
                <span className="font-arabic">{o.stepWord.ar}</span>{" "}
                {step} {o.ofWord.ar} 3
              </>
            ) : (
              <>
                {o.stepWord.en} {step} {o.ofWord.en} 3
              </>
            )}
          </span>
        </p>
      </div>

      {errorLine ? (
        <div
          className="rounded-[var(--radius-md)] border border-capsule-danger/35 bg-[var(--capsule-danger-soft)] px-4 py-3 text-sm text-[#5c3838]"
          role="alert"
        >
          {errorLine}
        </div>
      ) : null}

      <div key={step} className="capsule-step-enter">
        {step === 1 ? (
          <GlassPanel className="border-white/50 bg-white/45 shadow-[0_8px_40px_rgba(93,153,166,0.08)]">
            <div className="space-y-8">
              <div>
                <BilingualLabel pair={o.step1Title} locale={locale} as="h2" />
                <BilingualLabel
                  pair={o.step1Subtitle}
                  locale={locale}
                  as="p"
                  className="mt-3 !space-y-1"
                />
              </div>
              <div>
                <BilingualFieldLabel pair={o.age} locale={locale} htmlFor="ob-age" />
                <input
                  id="ob-age"
                  type="number"
                  min={1}
                  max={120}
                  inputMode="numeric"
                  className="capsule-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <BilingualFieldLabel pair={o.sex} locale={locale} />
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={locale === "ar" ? o.sex.ar : o.sex.en}
                >
                  {(
                    [
                      ["male", o.male],
                      ["female", o.female],
                      ["prefer_not_to_say", o.preferNot],
                    ] as const
                  ).map(([value, pair]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={sex === value}
                      onClick={() => setSex(value)}
                      className={cn(
                        "min-h-11 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition",
                        sex === value
                          ? "border-capsule-primary bg-[var(--capsule-primary-soft)] text-capsule-text shadow-[0_0_0_1px_rgba(93,153,166,0.35)]"
                          : "border-[var(--capsule-border)] bg-white/60 text-capsule-text-muted hover:bg-white/90",
                      )}
                    >
                      <span className={cn(locale === "ar" && "font-arabic")}>
                        {locale === "ar" ? pair.ar : pair.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="capsule-btn-primary min-w-[140px]"
                  disabled={busy}
                  onClick={() => void onStep1Next()}
                >
                  {busy
                    ? locale === "ar"
                      ? o.saving.ar
                      : o.saving.en
                    : locale === "ar"
                      ? o.next.ar
                      : o.next.en}
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : null}

        {step === 2 ? (
          <GlassPanel className="border-white/50 bg-white/45 shadow-[0_8px_40px_rgba(93,153,166,0.08)]">
            <div className="space-y-8">
              <div>
                <BilingualLabel pair={o.step2Title} locale={locale} as="h2" />
                <BilingualLabel
                  pair={o.step2Subtitle}
                  locale={locale}
                  as="p"
                  className="mt-3 !space-y-1"
                />
                <p className="mt-3 text-xs text-capsule-text-muted">
                  <span className={locale === "ar" ? "font-arabic" : ""}>
                    {locale === "ar"
                      ? o.optionalStepHint.ar
                      : o.optionalStepHint.en}
                  </span>
                </p>
              </div>
              <div>
                <BilingualFieldLabel
                  pair={o.conditions}
                  locale={locale}
                  htmlFor="ob-cond"
                />
                <textarea
                  id="ob-cond"
                  className="capsule-input min-h-[96px] resize-y"
                  rows={3}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>
              <div>
                <BilingualFieldLabel
                  pair={o.allergies}
                  locale={locale}
                  htmlFor="ob-all"
                />
                <textarea
                  id="ob-all"
                  className="capsule-input min-h-[96px] resize-y"
                  rows={3}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <button
                  type="button"
                  className="capsule-btn-secondary"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  {locale === "ar" ? o.back.ar : o.back.en}
                </button>
                <button
                  type="button"
                  className="capsule-btn-primary min-w-[140px]"
                  disabled={busy}
                  onClick={() => void onStep2Next()}
                >
                  {busy
                    ? locale === "ar"
                      ? o.saving.ar
                      : o.saving.en
                    : locale === "ar"
                      ? o.next.ar
                      : o.next.en}
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : null}

        {step === 3 ? (
          <GlassPanel className="border-white/50 bg-white/45 shadow-[0_8px_40px_rgba(93,153,166,0.08)]">
            <div className="space-y-10">
              <div>
                <BilingualLabel pair={o.step3Title} locale={locale} as="h2" />
                <BilingualLabel
                  pair={o.step3Subtitle}
                  locale={locale}
                  as="p"
                  className="mt-3 !space-y-1"
                />
              </div>

              <div className="space-y-8">
                {meds.map((med, medIndex) => (
                  <div
                    key={med.id}
                    className="rounded-[var(--radius-lg)] border border-[var(--capsule-border)] bg-white/35 p-5 shadow-sm backdrop-blur-sm"
                  >
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-capsule-text-muted">
                        {locale === "ar"
                          ? `دواء ${medIndex + 1}`
                          : `Medication ${medIndex + 1}`}
                      </span>
                      {meds.length > 1 ? (
                        <button
                          type="button"
                          className="capsule-btn-ghost-danger min-h-9 px-3 py-1.5 text-xs"
                          onClick={() =>
                            setMeds((prev) =>
                              prev.filter((x) => x.id !== med.id),
                            )
                          }
                        >
                          {locale === "ar"
                            ? o.removeMedication.ar
                            : o.removeMedication.en}
                        </button>
                      ) : null}
                    </div>

                    <MedicationFormFields
                      draft={med}
                      onChange={(patch) => updateMed(med.id, patch)}
                      fieldIdPrefix={med.id}
                      locale={locale}
                      o={o}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="capsule-btn-secondary w-full min-h-11"
                onClick={() =>
                  setMeds((prev) => [...prev, newMedDraft(timeZone)])
                }
              >
                <span className={locale === "ar" ? "font-arabic" : ""}>
                  {locale === "ar" ? o.addMedication.ar : o.addMedication.en}
                </span>
              </button>

              <div className="flex flex-wrap justify-between gap-3 border-t border-[color:rgba(110,135,141,0.15)] pt-8">
                <button
                  type="button"
                  className="capsule-btn-secondary"
                  disabled={busy}
                  onClick={() => setStep(2)}
                >
                  {locale === "ar" ? o.back.ar : o.back.en}
                </button>
                <button
                  type="button"
                  className="capsule-btn-primary min-w-[180px]"
                  disabled={busy}
                  onClick={() => void onFinish()}
                >
                  {busy
                    ? locale === "ar"
                      ? o.saving.ar
                      : o.saving.en
                    : locale === "ar"
                      ? o.finish.ar
                      : o.finish.en}
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : null}
      </div>
    </div>
    </>
  );
}
