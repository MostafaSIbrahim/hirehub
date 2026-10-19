import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { dashboardPath } from "@/lib/roles";


// Async + inside <Suspense>: the only part of this layout that depends on the request.
async function RedirectIfSignedIn() {
  const session = await getSession();
  if (session) redirect(dashboardPath(session.user.role));
  return null;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="text-2xl font-semibold text-primary">HireHub</Link>
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <RedirectIfSignedIn />
        </Suspense>
        {children}
      </div>
    </main>
  );
}