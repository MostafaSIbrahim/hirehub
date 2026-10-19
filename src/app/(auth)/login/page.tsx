import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · HireHub" };

type SearchParams = Promise<{ error?: string }>;

async function LoginWithParams({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams; // the request-dependent read happens here
  return <LoginForm initialError={error === "suspended" ? "Your account has been suspended." : null} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    // The fallback is the same form without the error, so users never see a blank card.
    <Suspense fallback={<LoginForm initialError={null} />}>
      <LoginWithParams searchParams={searchParams} />
    </Suspense>
  );
}