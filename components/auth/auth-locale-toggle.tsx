"use client";

import { cn } from "@/lib/cn";

export type AuthLang = "en" | "ar";

type Props = {
  value: AuthLang;
  onChange: (lang: AuthLang) => void;
};

/**
 * Animated pill toggle (EN ↔ العربية). Thumb position animates via `left` / `right`
 * (smoother than transform % in some engines). Track is `overflow-hidden` so rings stay inside.
 */
export function AuthLocaleToggle({ value, onChange }: Props) {
  const isEn = value === "en";

  return (
    <div className="flex justify-center" dir="ltr">
      <div
        className={cn(
          "relative inline-flex h-11 min-w-[216px] select-none rounded-full",
          "border border-[color:rgba(110,135,141,0.38)] bg-white/55 p-1",
          "shadow-[0_2px_12px_rgba(93,153,166,0.08)] backdrop-blur-md",
          "overflow-hidden",
        )}
        role="tablist"
        aria-label="Language"
      >
        {/* Sliding thumb — inset with left+right so transition animates smoothly */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1 bottom-1 rounded-full",
            "bg-[var(--capsule-primary-soft)]",
            /* Inset ring only (no outer glow) so nothing clips past track */
            "shadow-[inset_0_0_0_1px_rgba(93,153,166,0.32)]",
            "transition-[left,right] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
            "motion-reduce:transition-none",
          )}
          style={
            isEn
              ? { left: "4px", right: "calc(50% + 2px)" }
              : { left: "calc(50% + 2px)", right: "4px" }
          }
        />

        <button
          type="button"
          role="tab"
          aria-selected={isEn}
          onClick={() => onChange("en")}
          className={cn(
            "relative z-10 flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-wide transition-colors duration-200",
            isEn ? "text-capsule-text" : "text-capsule-text-muted hover:text-capsule-text",
          )}
        >
          EN
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isEn}
          onClick={() => onChange("ar")}
          className={cn(
            "relative z-10 flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold tracking-wide transition-colors duration-200",
            "font-arabic",
            !isEn ? "text-capsule-text" : "text-capsule-text-muted hover:text-capsule-text",
          )}
        >
          العربية
        </button>
      </div>
    </div>
  );
}
