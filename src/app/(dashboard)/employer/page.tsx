import Link from "next/link";
import { Briefcase, Building2, PartyPopper, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { getEmployerDashboard } from "@/server/services/dashboard.service";
import { requireRole } from "@/server/session";

export default async function EmployerDashboard() {
  const user = await requireRole("EMPLOYER");
  const data = await getEmployerDashboard(user.id);

  if (!data.company) {
    return (
      <>
        <PageHeader title="Welcome to HireHub" description="One step before you can post jobs." />
        <EmptyState
          icon={Building2}
          title="Create your company profile"
          description="Candidates see your company on every job you post."
          action={<Button asChild><Link href="/employer/company">Set up company</Link></Button>}
        />
      </>
    );
  }

  const { company, stats, latest } = data;
  return (
    <>
      <PageHeader
        title={company.name}
        description="Manage your jobs and applicants."
        actions={<Button asChild><Link href="/employer/jobs/new">Post a job</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={stats.activeJobs} icon={Briefcase} />
        <StatCard label="Total applicants" value={stats.totalApplicants} icon={Users} />
        <StatCard label="New this week" value={stats.newThisWeek} icon={Sparkles} />
        <StatCard label="Hires" value={stats.hires} icon={PartyPopper} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Latest applicants</CardTitle></CardHeader>
        <CardContent>
          {latest.length === 0 ? (
            <EmptyState icon={Users} title="No applicants yet" description="Applicants for your jobs will show up here." />
          ) : (
            <ul className="divide-y">
              {latest.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{app.seeker.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {app.job.title} · {timeAgo(app.createdAt)}
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