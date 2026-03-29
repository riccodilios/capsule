"use client";

import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/cn";

type CapsuleLogoProps = {
  className?: string;
  priority?: boolean;
  alt?: string;
};

/** Brand mark: add `public/capsule-logo.png`. */
export function CapsuleLogo({
  className,
  priority = false,
  alt,
}: CapsuleLogoProps) {
  const { t } = useLocale();

  return (
    <span className="inline-flex shrink-0 items-center" dir="ltr">
      <Image
        src="/capsule-logo.png"
        alt={alt ?? t.meta.name}
        width={320}
        height={96}
        className={cn(
          "h-9 w-auto max-w-[min(100%,220px)] object-contain object-left sm:h-10",
          className,
        )}
        priority={priority}
      />
    </span>
  );
}
