"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const copy = {
  en: "Back to home",
  ar: "العودة للرئيسية",
} as const;

export function AuthBackLink({ lang }: { lang: "en" | "ar" }) {
  const label = copy[lang];

  return (
    <Link
      href="/"
      className={cn(
        "group -ms-1 inline-flex items-center gap-2 rounded-full py-1.5 pe-2 ps-1 text-sm font-medium text-capsule-text-muted transition-colors hover:text-capsule-primary",
        lang === "ar" && "font-arabic",
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgba(110,135,141,0.28)] bg-white/50 text-capsule-primary shadow-sm transition-[transform,box-shadow] duration-200 group-hover:border-[color:rgba(93,153,166,0.45)] group-hover:shadow-[0_4px_14px_rgba(93,153,166,0.12)] group-active:scale-[0.96]"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 rtl:rotate-180"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      {label}
    </Link>
  );
}
