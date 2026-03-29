import { AppShell } from "@/components/app-shell";
import { OnboardingGate } from "@/components/onboarding-gate";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGate>
      <AppShell>{children}</AppShell>
    </OnboardingGate>
  );
}
