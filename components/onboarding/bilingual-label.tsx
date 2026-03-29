import type { Bilingual } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/cn";

export function BilingualLabel({
  pair,
  locale,
  className,
  as: Tag = "div",
}: {
  pair: Bilingual;
  locale: Locale;
  className?: string;
  as?: "div" | "h1" | "h2" | "p" | "span";
}) {
  const primaryTitle =
    Tag === "h1" || Tag === "h2"
      ? "text-2xl font-semibold tracking-tight sm:text-3xl"
      : "text-base font-semibold tracking-tight";
  if (locale === "ar") {
    return (
      <Tag className={cn("space-y-1", className)} dir="rtl">
        <span
          className={cn(
            "font-arabic block text-capsule-text",
            primaryTitle,
          )}
        >
          {pair.ar}
        </span>
        <span
          className="block text-xs font-medium text-capsule-text-muted"
          dir="ltr"
        >
          {pair.en}
        </span>
      </Tag>
    );
  }
  return (
    <Tag className={cn("space-y-1", className)} dir="ltr">
      <span className={cn("block text-capsule-text", primaryTitle)}>
        {pair.en}
      </span>
      <span className="font-arabic block text-xs font-medium text-capsule-text-muted">
        {pair.ar}
      </span>
    </Tag>
  );
}

export function BilingualFieldLabel({
  pair,
  locale,
  htmlFor,
  className,
}: {
  pair: Bilingual;
  locale: Locale;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      className={cn("capsule-label block", className)}
      htmlFor={htmlFor}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <span
        className={cn(
          "block",
          locale === "ar" ? "font-arabic" : "",
        )}
      >
        {locale === "ar" ? pair.ar : pair.en}
      </span>
      <span
        className={cn(
          "mt-0.5 block text-xs font-normal text-capsule-text-muted",
          locale === "ar" ? "text-right" : "",
          locale === "ar" ? "" : "font-arabic",
        )}
        dir={locale === "ar" ? "ltr" : "rtl"}
      >
        {locale === "ar" ? pair.en : pair.ar}
      </span>
    </label>
  );
}
