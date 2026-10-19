"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark, Briefcase, Building2, FileText, LayoutDashboard,
  PlusCircle, ScrollText, Search, ShieldCheck, UserRound, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: Record<string, NavItem[]> = {
  SEEKER: [
    { href: "/seeker", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Find jobs", icon: Search },
    { href: "/seeker/applications", label: "My applications", icon: FileText },
    { href: "/seeker/saved", label: "Saved jobs", icon: Bookmark },
    { href: "/seeker/profile", label: "Profile", icon: UserRound },
  ],
  EMPLOYER: [
    { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employer/jobs", label: "My jobs", icon: Briefcase },
    { href: "/employer/jobs/new", label: "Post a job", icon: PlusCircle },
    { href: "/employer/company", label: "Company", icon: Building2 },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/jobs", label: "Jobs", icon: ShieldCheck },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  ],
};

export function DashboardNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV[role] ?? NAV.SEEKER;

  // The *longest* matching href wins, so on /employer/jobs/new only "Post a job"
  // is active, not "My jobs" as well.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}