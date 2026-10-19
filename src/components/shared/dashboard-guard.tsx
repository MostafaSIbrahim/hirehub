import Link from "next/link";
import { requireRole } from "@/server/session";
import { dashboardPath, type Role } from "@/lib/roles";
import { LogoutButton } from "./logout-button";
import { DashboardNav } from "./dashboard-nav";
import { MobileNav } from "./mobile-nav";

const LABELS: Record<Role, string> = { SEEKER: "Job seeker", EMPLOYER: "Employer", ADMIN: "Admin" };

export async function DashboardGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = await requireRole(role); // layer 2: nothing below renders unless this passes

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link href={dashboardPath(role)} className="mb-6 px-3 text-lg font-semibold text-primary">
          HireHub
        </Link>
        <DashboardNav role={role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-card/80 px-4 backdrop-blur">
          <MobileNav role={role} />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              <span className="font-medium text-foreground">{user.name}</span> · {LABELS[role]}
            </span>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}