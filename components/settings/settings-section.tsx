import type { ReactNode } from "react";
import { GlassPanel } from "@/components/glass-panel";
import { cn } from "@/lib/cn";

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="capsule-section-title">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-capsule-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <GlassPanel className="border-[color:rgba(110,135,141,0.38)] bg-white/50 shadow-[0_4px_24px_rgba(93,153,166,0.06)]">
        {children}
      </GlassPanel>
    </section>
  );
}
