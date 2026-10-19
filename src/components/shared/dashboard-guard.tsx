import { requireRole } from "@/server/session";
import { LogoutButton } from "@/components/shared/logout-button";
import type { Role } from "@/lib/roles";

const LABELS: Record<Role, string> = { SEEKER: "Seeker", EMPLOYER: "Employer", ADMIN: "Admin" };

/** Async server component: checks the real session, then renders the dashboard frame. */
export async function DashboardGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = await requireRole(role); // layer 2: redirects if wrong role / suspended / logged out
  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.name}</span> · {LABELS[role]}
        </p>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}