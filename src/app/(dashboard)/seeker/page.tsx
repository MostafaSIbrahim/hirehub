import Link from "next/link";
import { Bookmark, CalendarCheck, FileText, Hourglass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { getSeekerDashboard } from "@/server/services/dashboard.service";
import { requireRole } from "@/server/session";

export default async function SeekerDashboard() {
  const user = await requireRole("SEEKER"); // free: cache() reuses the layout's session lookup
  const { stats, recent } = await getSeekerDashboard(user.id);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your job search at a glance."
        actions={<Button asChild><Link href="/jobs">Find jobs</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications sent" value={stats.total} icon={FileText} />
        <StatCard label="In review" value={stats.inReview} icon={Hourglass} />
        <StatCard label="Interviews" value={stats.interviews} icon={CalendarCheck} />
        <StatCard label="Saved jobs" value={stats.saved} icon={Bookmark} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent applications</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No applications yet"
              description="Browse open roles and apply in a couple of clicks."
              action={<Button asChild size="sm"><Link href="/jobs">Browse jobs</Link></Button>}
            />
          ) : (
            <ul className="divide-y">
              {recent.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/jobs/${app.job.slug}`} className="block truncate font-medium hover:underline">
                      {app.job.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {app.job.company.name} · applied {timeAgo(app.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}