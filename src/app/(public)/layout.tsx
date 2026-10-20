import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { dashboardPath } from "@/lib/roles";
import { getSession } from "@/server/session";

function GuestButtons() {
  return (
    <>
      <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
      <Button asChild size="sm"><Link href="/register">Sign up</Link></Button>
    </>
  );
}

async function AccountButtons() {
  const session = await getSession();
  if (!session) return <GuestButtons />;
  return <Button asChild size="sm"><Link href={dashboardPath(session.user.role)}>Dashboard</Link></Button>;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-primary">HireHub</Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/jobs">Jobs</Link></Button>
            {/* Static guess first (logged out), swapped for the real buttons once the session is read */}
            <Suspense fallback={<GuestButtons />}><AccountButtons /></Suspense>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}