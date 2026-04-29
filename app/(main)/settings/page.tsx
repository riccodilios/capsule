"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocale } from "@/lib/i18n/locale-context";
import { SettingsSection } from "@/components/settings/settings-section";
import { COMMON_TIMEZONES, DEFAULT_TIME_ZONE } from "@/lib/timezones";
import { cn } from "@/lib/cn";

type Sex = "male" | "female" | "prefer_not_to_say";

export default function SettingsPage() {
  const { t, locale, dir } = useLocale();
  const s = t.settings;
  const settings = useQuery(api.userSettings.get, {});
  const updateLocale = useMutation(api.userSettings.updateLocale);
  const updateTimeZone = useMutation(api.userSettings.updateTimeZone);
  const updateProfile = useMutation(api.userSettings.updateProfile);
  const saveMedicalContext = useMutation(api.onboarding.saveMedicalContext);
  const setNotificationsEnabled = useMutation(api.push.setNotificationsEnabled);
  const upsertSubscription = useMutation(api.push.upsertSubscription);
  const removeSubscription = useMutation(api.push.removeSubscription);

  const [ageInput, setAgeInput] = useState("");
  const [sexValue, setSexValue] = useState<Sex | "">("");
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [conditionsInput, setConditionsInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [medicalDirty, setMedicalDirty] = useState(false);
  const [medicalSaving, setMedicalSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setAgeInput(settings.age != null ? String(settings.age) : "");
    setSexValue(settings.sex ?? "");
    setProfileDirty(false);
  }, [settings?._id, settings?.age, settings?.sex]);

  useEffect(() => {
    if (!settings) return;
    setConditionsInput(settings.conditions ?? "");
    setAllergiesInput(settings.allergies ?? "");
    setMedicalDirty(false);
  }, [settings?._id, settings?.conditions, settings?.allergies]);

  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const zoneOptions = useMemo(() => {
    const set = new Set<string>(COMMON_TIMEZONES);
    if (!set.has(timeZone)) return [timeZone, ...COMMON_TIMEZONES];
    return [...COMMON_TIMEZONES];
  }, [timeZone]);

  const uiLocale = settings?.locale ?? "ar";
  const notificationsEnabled = settings?.notificationsEnabled === true;
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function enableNotifications() {
    if (typeof window === "undefined") return;
    setNotifError(null);
    setNotifBusy(true);
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setNotifError(s.notificationsUnsupported);
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNotifError(s.notificationsDenied);
        await setNotificationsEnabled({ enabled: false });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      if (!reg.pushManager) {
        setNotifError(s.notificationsUnsupported);
        await setNotificationsEnabled({ enabled: false });
        return;
      }

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setNotifError("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      await upsertSubscription({
        subscription: sub.toJSON() as {
          endpoint: string;
          expirationTime?: number | null;
          keys: { p256dh: string; auth: string };
        },
        userAgent: navigator.userAgent,
      });
      await setNotificationsEnabled({ enabled: true });
    } finally {
      setNotifBusy(false);
    }
  }

  async function disableNotifications() {
    if (typeof window === "undefined") return;
    setNotifError(null);
    setNotifBusy(true);
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const json = sub.toJSON() as { endpoint: string };
          await sub.unsubscribe();
          if (json.endpoint) {
            await removeSubscription({ endpoint: json.endpoint });
          }
        }
      }
      await setNotificationsEnabled({ enabled: false });
    } finally {
      setNotifBusy(false);
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const n = Number.parseInt(ageInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > 120) return;
    if (!sexValue) return;
    setProfileSaving(true);
    try {
      await updateProfile({ age: n, sex: sexValue as Sex });
      setProfileDirty(false);
    } finally {
      setProfileSaving(false);
    }
  }

  async function onSaveMedical(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setMedicalSaving(true);
    try {
      await saveMedicalContext({
        conditions: conditionsInput.trim() || undefined,
        allergies: allergiesInput.trim() || undefined,
      });
      setMedicalDirty(false);
    } finally {
      setMedicalSaving(false);
    }
  }

  if (settings === undefined) {
    return (
      <p className="text-capsule-text-muted" role="status">
        {t.common.loading}
      </p>
    );
  }

  return (
    <div className="space-y-12" dir={dir}>
      <h1 className="capsule-page-title">{s.title}</h1>

      <SettingsSection title={s.profile} description={s.profileHint}>
        <form onSubmit={(e) => void onSaveProfile(e)} className="space-y-6">
          <div>
            <label className="capsule-label" htmlFor="set-age">
              {s.age}
            </label>
            <input
              id="set-age"
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              className="capsule-input max-w-[200px]"
              value={ageInput}
              onChange={(e) => {
                setAgeInput(e.target.value);
                setProfileDirty(true);
              }}
            />
          </div>
          <div>
            <p className="capsule-label mb-3">{s.sex}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {(
                [
                  ["male", s.male],
                  ["female", s.female],
                  ["prefer_not_to_say", s.preferNot],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={sexValue === value}
                  onClick={() => {
                    setSexValue(value);
                    setProfileDirty(true);
                  }}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition",
                    sexValue === value
                      ? "border-capsule-primary bg-[var(--capsule-primary-soft)] text-capsule-text shadow-[0_0_0_1px_rgba(93,153,166,0.35)]"
                      : "border-[var(--capsule-border)] bg-white/60 text-capsule-text-muted hover:bg-white/90",
                  )}
                >
                  <span className={cn(locale === "ar" && "font-arabic")}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end border-t border-[color:rgba(110,135,141,0.15)] pt-6">
            <button
              type="submit"
              className="capsule-btn-primary min-w-[140px]"
              disabled={
                profileSaving || !profileDirty || !sexValue || !ageInput.trim()
              }
            >
              {profileSaving ? t.common.loading : s.saveProfile}
            </button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection title={s.medicalRecord} description={s.medicalRecordHint}>
        <form onSubmit={(e) => void onSaveMedical(e)} className="space-y-6">
          <div>
            <label className="capsule-label" htmlFor="set-conditions">
              {s.conditionsField}
            </label>
            <textarea
              id="set-conditions"
              className="capsule-input mt-2 min-h-[100px] w-full max-w-2xl resize-y"
              rows={4}
              value={conditionsInput}
              onChange={(e) => {
                setConditionsInput(e.target.value);
                setMedicalDirty(true);
              }}
            />
          </div>
          <div>
            <label className="capsule-label" htmlFor="set-allergies">
              {s.allergiesField}
            </label>
            <textarea
              id="set-allergies"
              className="capsule-input mt-2 min-h-[100px] w-full max-w-2xl resize-y"
              rows={4}
              value={allergiesInput}
              onChange={(e) => {
                setAllergiesInput(e.target.value);
                setMedicalDirty(true);
              }}
            />
          </div>
          <div className="flex justify-end border-t border-[color:rgba(110,135,141,0.15)] pt-6">
            <button
              type="submit"
              className="capsule-btn-primary min-w-[160px]"
              disabled={medicalSaving || !medicalDirty}
            >
              {medicalSaving ? t.common.loading : s.saveMedicalRecord}
            </button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection title={s.preferences}>
        <div className="space-y-8">
          <div>
            <p className="capsule-label mb-2">{s.notifications}</p>
            <p className="text-sm text-capsule-text-muted">{s.notificationsHint}</p>
            {notifError ? (
              <p className="mt-2 text-sm text-[color:var(--capsule-danger)]" role="alert">
                {notifError}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[color:rgba(110,135,141,0.2)] bg-white/40 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-capsule-text">
                  {notificationsEnabled ? s.notificationsDisable : s.notificationsEnable}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={notificationsEnabled}
                  disabled={notifBusy}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next) void enableNotifications();
                    else void disableNotifications();
                  }}
                />
                <span
                  className={cn(
                    "h-7 w-12 rounded-full border transition",
                    "border-[color:rgba(110,135,141,0.35)] bg-white/60 peer-checked:bg-[var(--capsule-primary)]",
                    notifBusy && "opacity-60",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition",
                    "peer-checked:translate-x-5",
                  )}
                />
              </label>
            </div>
          </div>
          <div>
            <p className="capsule-label mb-3">{s.language}</p>
            <div className="inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[color:rgba(110,135,141,0.35)] bg-white/40 p-1">
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-[var(--radius-sm)] px-5 py-2 text-sm font-medium transition",
                  uiLocale === "en"
                    ? "bg-[var(--capsule-primary-soft)] text-capsule-text shadow-[0_0_0_1px_rgba(93,153,166,0.35)]"
                    : "text-capsule-text-muted hover:bg-white/80",
                )}
                onClick={() => void updateLocale({ locale: "en" })}
              >
                {s.english}
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-10 rounded-[var(--radius-sm)] px-5 py-2 text-sm font-medium transition",
                  uiLocale === "ar" && "font-arabic",
                  uiLocale === "ar"
                    ? "bg-[var(--capsule-primary-soft)] text-capsule-text shadow-[0_0_0_1px_rgba(93,153,166,0.35)]"
                    : "text-capsule-text-muted hover:bg-white/80",
                )}
                onClick={() => void updateLocale({ locale: "ar" })}
              >
                {s.arabic}
              </button>
            </div>
            <p className="mt-4 text-sm text-capsule-text-muted">
              <span className="font-medium text-capsule-text">
                {s.directionLabel}:{" "}
              </span>
              {uiLocale === "ar" ? "RTL" : "LTR"} — {s.directionAuto}
            </p>
          </div>

          <div>
            <label className="capsule-label mb-2 block" htmlFor="set-tz">
              {s.timezone}
            </label>
            <p className="mb-3 text-sm text-capsule-text-muted">{s.hint}</p>
            <select
              id="set-tz"
              className="capsule-input max-w-md cursor-pointer py-3"
              value={timeZone}
              onChange={(e) => void updateTimeZone({ timeZone: e.target.value })}
            >
              {zoneOptions.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
