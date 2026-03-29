import { OnboardingClient } from "./onboarding-client";

type PageProps = {
  searchParams: Promise<{ locale?: string }>;
};

export default async function OnboardingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialLocale = searchParams.locale === "en" ? "en" : "ar";

  return <OnboardingClient initialLocale={initialLocale} />;
}
