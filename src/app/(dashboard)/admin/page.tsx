import { Building2, Briefcase, FileText, ScrollText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { timeAgo } from "@/lib/format";
import { getAdminDashboard } from "@/server/services/dashboard.service";
import { requireRole } from "@/server/session";

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const { stats, recentAudit } = await getAdminDashboard();

  return (
    <>
      <PageHeader title="Overview" description="Platform health and moderation." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats.users} icon={Users} hint={`${stats.seekers} seekers · ${stats.employers} employers`} />
        <StatCard label="Published jobs" value={stats.publishedJobs} icon={Briefcase} />
        <StatCard label="Applications today" value={stats.applicationsToday} icon={FileText} />
        <StatCard label="Unverified companies" value={stats.unverifiedCompanies} icon={Building2} hint="Pending moderation" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent admin actions</CardTitle></CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <EmptyState icon={ScrollText} title="No admin actions yet" description="Suspensions, role changes and moderation will be logged here." />
          ) : (
            <ul className="divide-y">
              {recentAudit.map((log) => (
                <li key={log.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground">{timeAgo(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}