import { SignUpContent } from "@/components/auth/sign-up-content";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function SignUpPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialLang = searchParams.lang === "en" ? "en" : "ar";

  return <SignUpContent initialLang={initialLang} />;
}
