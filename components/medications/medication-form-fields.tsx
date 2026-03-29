"use client";

import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import {
  from12h,
  to12h,
  type AmPm,
  type MedicationDraft,
} from "@/lib/medication-draft";
import { BilingualFieldLabel } from "@/components/onboarding/bilingual-label";
import { cn } from "@/lib/cn";

type Onboarding = Dictionary["onboarding"];

const timeInputClass =
  "capsule-input mt-0 w-[4.25rem] font-mono text-base placeholder:text-capsule-text-muted/50";

/** Hour 1–12 only; invalid two-digit values (e.g. 20) do not commit until fixed or blur. */
function Hour12Input({
  id,
  ariaLabel,
  placeholder,
  unset,
  h12,
  minute,
  ampm,
  onCommit,
}: {
  id: string;
  ariaLabel: string;
  placeholder: string;
  /** When true, show placeholder only (like minute “30”) until the user enters an hour. */
  unset: boolean;
  h12: number;
  minute: number;
  ampm: AmPm;
  onCommit: (hour: number, minute: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!editing) {
      setText(unset ? "" : String(h12));
    }
  }, [h12, editing, unset]);

  const display = editing ? text : unset ? "" : String(h12);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      className={timeInputClass}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={display}
      onFocus={() => {
        setEditing(true);
        setText(unset ? "" : String(h12));
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
        setText(v);
        if (v === "") {
          onCommit(-1, minute);
          return;
        }
        if (v.length === 1) {
          const d = Number.parseInt(v, 10);
          if (d >= 1 && d <= 9) {
            const { hour, minute: mm } = from12h(d, minute, ampm);
            onCommit(hour, mm);
          }
          return;
        }
        const d = Number.parseInt(v, 10);
        if (!Number.isFinite(d)) return;
        if (d >= 1 && d <= 12) {
          const { hour, minute: mm } = from12h(d, minute, ampm);
          onCommit(hour, mm);
        }
      }}
      onBlur={(e) => {
        setEditing(false);
        const raw = e.target.value.replace(/\D/g, "");
        if (raw === "") {
          onCommit(-1, minute);
        }
        setText("");
      }}
    />
  );
}

/** Minutes 0–59 only; values like 70 do not commit. */
function MinuteInput({
  id,
  ariaLabel,
  placeholder,
  h12,
  minute,
  ampm,
  onCommit,
}: {
  id: string;
  ariaLabel: string;
  placeholder: string;
  h12: number;
  minute: number;
  ampm: AmPm;
  onCommit: (hour: number, minute: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!editing) {
      setText(minute === 0 ? "" : String(minute));
    }
  }, [minute, editing]);

  const display = editing ? text : minute === 0 ? "" : String(minute);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      className={timeInputClass}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={display}
      onFocus={() => {
        setEditing(true);
        setText(minute === 0 ? "" : String(minute));
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
        setText(v);
        if (v === "") {
          const { hour, minute: mm } = from12h(h12, 0, ampm);
          onCommit(hour, mm);
          return;
        }
        if (v.length === 1) {
          const d = Number.parseInt(v, 10);
          if (d >= 0 && d <= 9) {
            const { hour, minute: mm } = from12h(h12, d, ampm);
            onCommit(hour, mm);
          }
          return;
        }
        const d = Number.parseInt(v, 10);
        if (!Number.isFinite(d)) return;
        if (d >= 0 && d <= 59) {
          const { hour, minute: mm } = from12h(h12, d, ampm);
          onCommit(hour, mm);
        }
      }}
      onBlur={() => {
        setEditing(false);
        setText("");
      }}
    />
  );
}

export function MedicationFormFields({
  draft,
  onChange,
  fieldIdPrefix,
  locale,
  o,
}: {
  draft: MedicationDraft;
  onChange: (patch: Partial<MedicationDraft>) => void;
  fieldIdPrefix: string;
  locale: Locale;
  o: Onboarding;
}) {
  function setTimeAt(
    index: number,
    hour: number,
    minute: number,
  ) {
    const next = [...draft.reminderTimes];
    next[index] = { hour, minute };
    onChange({ reminderTimes: next });
  }

  function addTimeRow() {
    onChange({
      reminderTimes: [...draft.reminderTimes, { hour: -1, minute: 0 }],
    });
  }

  function removeTimeAt(index: number) {
    onChange({
      reminderTimes: draft.reminderTimes.filter((_, i) => i !== index),
    });
  }

  function toggleWeekday(day: number) {
    const weekdays = draft.weekdays.includes(day)
      ? draft.weekdays.filter((d) => d !== day)
      : [...draft.weekdays, day];
    onChange({ weekdays });
  }

  return (
    <div className="space-y-5">
      <div>
        <BilingualFieldLabel
          pair={o.medName}
          locale={locale}
          htmlFor={`${fieldIdPrefix}-mn`}
        />
        <input
          id={`${fieldIdPrefix}-mn`}
          className="capsule-input"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div>
        <BilingualFieldLabel
          pair={o.medDosage}
          locale={locale}
          htmlFor={`${fieldIdPrefix}-md`}
        />
        <input
          id={`${fieldIdPrefix}-md`}
          className="capsule-input"
          value={draft.dosage}
          onChange={(e) => onChange({ dosage: e.target.value })}
        />
      </div>

      <div>
        <BilingualFieldLabel pair={o.schedule} locale={locale} />
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["daily", o.scheduleDaily],
              ["every_n_days", o.scheduleEveryNDays],
              ["weekly", o.scheduleWeekly],
              ["monthly", o.scheduleMonthly],
            ] as const
          ).map(([key, pair]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                onChange({ scheduleType: key })
              }
              className={cn(
                "min-h-10 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium transition sm:text-sm",
                draft.scheduleType === key
                  ? "border-capsule-primary bg-[var(--capsule-primary-soft)] text-capsule-text"
                  : "border-[var(--capsule-border)] bg-white/60 text-capsule-text-muted",
              )}
            >
              <span className={cn(locale === "ar" ? "font-arabic" : "")}>
                {locale === "ar" ? pair.ar : pair.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {draft.scheduleType === "every_n_days" ? (
        <div>
          <BilingualFieldLabel
            pair={o.intervalDays}
            locale={locale}
            htmlFor={`${fieldIdPrefix}-int`}
          />
          <input
            id={`${fieldIdPrefix}-int`}
            type="number"
            min={1}
            max={365}
            className="capsule-input max-w-[200px]"
            value={draft.intervalDays}
            onChange={(e) =>
              onChange({
                intervalDays: Number(e.target.value) || 1,
              })
            }
          />
          <div className="mt-2">
            <BilingualFieldLabel
              pair={o.anchorDay}
              locale={locale}
              htmlFor={`${fieldIdPrefix}-anch`}
            />
            <input
              id={`${fieldIdPrefix}-anch`}
              type="date"
              className="capsule-input max-w-[240px]"
              value={draft.anchorDate}
              onChange={(e) => onChange({ anchorDate: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {draft.scheduleType === "weekly" ? (
        <div>
          <p className="capsule-label">
            <span className={locale === "ar" ? "font-arabic" : ""}>
              {locale === "ar" ? o.scheduleWeekly.ar : o.scheduleWeekly.en}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.weekdaysShort.map((dayPair, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={cn(
                  "min-h-9 min-w-[2.75rem] rounded-[var(--radius-md)] border px-2 py-1.5 text-xs font-medium",
                  draft.weekdays.includes(day)
                    ? "border-capsule-primary bg-[var(--capsule-primary-soft)]"
                    : "border-[var(--capsule-border)] bg-white/60 text-capsule-text-muted",
                )}
              >
                <span className={cn(locale === "ar" ? "font-arabic" : "")}>
                  {locale === "ar" ? dayPair.ar : dayPair.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {draft.scheduleType === "monthly" ? (
        <div>
          <BilingualFieldLabel
            pair={o.dayOfMonth}
            locale={locale}
            htmlFor={`${fieldIdPrefix}-dom`}
          />
          <input
            id={`${fieldIdPrefix}-dom`}
            type="number"
            min={1}
            max={31}
            className="capsule-input max-w-[120px]"
            value={draft.dayOfMonth}
            onChange={(e) =>
              onChange({
                dayOfMonth: Number(e.target.value) || 1,
              })
            }
          />
        </div>
      ) : null}

      <div>
        <BilingualFieldLabel pair={o.reminderTimes} locale={locale} />
        <div className="mt-3 space-y-2">
          {draft.reminderTimes.map((tm, ti) => {
            const hourUnset = tm.hour < 0;
            const { h12, ampm } = hourUnset
              ? { h12: 12, ampm: "am" as AmPm }
              : to12h(tm.hour);
            return (
            <div
              key={`${fieldIdPrefix}-t-${ti}`}
              className="flex flex-wrap items-center gap-2"
              dir="ltr"
            >
              <Hour12Input
                id={`${fieldIdPrefix}-t-${ti}-h`}
                ariaLabel={locale === "ar" ? o.timeHour.ar : o.timeHour.en}
                placeholder={
                  locale === "ar"
                    ? o.timePlaceholderHour.ar
                    : o.timePlaceholderHour.en
                }
                unset={hourUnset}
                h12={h12}
                minute={tm.minute}
                ampm={ampm}
                onCommit={(hour, minute) => setTimeAt(ti, hour, minute)}
              />
              <span className="select-none text-capsule-text-muted" aria-hidden>
                :
              </span>
              <MinuteInput
                id={`${fieldIdPrefix}-t-${ti}-m`}
                ariaLabel={locale === "ar" ? o.timeMinute.ar : o.timeMinute.en}
                placeholder={
                  locale === "ar"
                    ? o.timePlaceholderMinute.ar
                    : o.timePlaceholderMinute.en
                }
                h12={h12}
                minute={tm.minute}
                ampm={ampm}
                onCommit={(hour, minute) => setTimeAt(ti, hour, minute)}
              />
              <select
                id={`${fieldIdPrefix}-t-${ti}-ampm`}
                className="capsule-input mt-0 min-w-[5.25rem] text-base"
                aria-label={
                  locale === "ar"
                    ? `${o.timeAm.ar} / ${o.timePm.ar}`
                    : `${o.timeAm.en} / ${o.timePm.en}`
                }
                value={ampm}
                onChange={(e) => {
                  const next = e.target.value as "am" | "pm";
                  const { hour, minute } = from12h(h12, tm.minute, next);
                  setTimeAt(ti, hour, minute);
                }}
              >
                <option value="am">
                  {locale === "ar" ? o.timeAm.ar : o.timeAm.en}
                </option>
                <option value="pm">
                  {locale === "ar" ? o.timePm.ar : o.timePm.en}
                </option>
              </select>
              {draft.reminderTimes.length > 1 ? (
                <button
                  type="button"
                  className="capsule-btn-secondary min-h-9 px-3 py-1.5 text-xs"
                  onClick={() => removeTimeAt(ti)}
                >
                  {locale === "ar" ? o.removeTime.ar : o.removeTime.en}
                </button>
              ) : null}
            </div>
            );
          })}
          <button
            type="button"
            className="capsule-btn-secondary mt-1 min-h-9 px-3 py-1.5 text-xs"
            onClick={addTimeRow}
          >
            {locale === "ar" ? o.addTime.ar : o.addTime.en}
          </button>
        </div>
      </div>

      <div>
        <BilingualFieldLabel pair={o.duration} locale={locale} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ durationKind: "ongoing" })}
            className={cn(
              "min-h-10 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium sm:text-sm",
              draft.durationKind === "ongoing"
                ? "border-capsule-primary bg-[var(--capsule-primary-soft)]"
                : "border-[var(--capsule-border)] bg-white/60",
            )}
          >
            <span className={cn(locale === "ar" ? "font-arabic" : "")}>
              {locale === "ar" ? o.durationOngoing.ar : o.durationOngoing.en}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ durationKind: "temporary" })}
            className={cn(
              "min-h-10 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium sm:text-sm",
              draft.durationKind === "temporary"
                ? "border-capsule-primary bg-[var(--capsule-primary-soft)]"
                : "border-[var(--capsule-border)] bg-white/60",
            )}
          >
            <span className={cn(locale === "ar" ? "font-arabic" : "")}>
              {locale === "ar"
                ? o.durationTemporary.ar
                : o.durationTemporary.en}
            </span>
          </button>
        </div>
        {draft.durationKind === "temporary" ? (
          <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-[var(--capsule-border)] bg-white/40 p-4">
            <p className="text-xs text-capsule-text-muted">
              <span className={locale === "ar" ? "font-arabic" : ""}>
                {locale === "ar"
                  ? o.limitedCourseHint.ar
                  : o.limitedCourseHint.en}
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <BilingualFieldLabel
                  pair={o.dateFrom}
                  locale={locale}
                  htmlFor={`${fieldIdPrefix}-df`}
                />
                <input
                  id={`${fieldIdPrefix}-df`}
                  type="date"
                  className="capsule-input"
                  value={draft.startDate}
                  onChange={(e) => onChange({ startDate: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <BilingualFieldLabel
                  pair={o.dateTo}
                  locale={locale}
                  htmlFor={`${fieldIdPrefix}-dt`}
                />
                <input
                  id={`${fieldIdPrefix}-dt`}
                  type="date"
                  className="capsule-input"
                  value={draft.endDate}
                  onChange={(e) => onChange({ endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
