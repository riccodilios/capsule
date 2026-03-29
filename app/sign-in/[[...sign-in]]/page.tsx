import { SignInContent } from "@/components/auth/sign-in-content";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function SignInPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialLang = searchParams.lang === "en" ? "en" : "ar";

  return <SignInContent initialLang={initialLang} />;
}
