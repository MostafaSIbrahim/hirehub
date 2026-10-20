import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationTimeline } from "@/components/shared/application-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { canWithdraw } from "@/lib/application-status";
import { timeAgo } from "@/lib/format";
import { listMyApplications } from "@/server/services/application.service";
import { requireRole } from "@/server/session";
import { WithdrawButton } from "./withdraw-button";

export default async function MyApplicationsPage() {
  const user = await requireRole("SEEKER");
  const applications = await listMyApplications(user.id);

  return (
    <>
      <PageHeader title="My applications" description="Track every application and where it stands." />
      {applications.length === 0 ? (
        <EmptyState icon={FileText} title="No applications yet" description="Find a role you like and apply in a couple of clicks."
          action={<Button asChild size="sm"><Link href="/jobs">Browse jobs</Link></Button>} />
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li key={app.id}>
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_16rem]">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/jobs/${app.job.slug}`} className="truncate font-semibold hover:underline">{app.job.title}</Link>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{app.job.company.name} · applied {timeAgo(app.createdAt)}</p>
                    {canWithdraw(app.status) && <WithdrawButton applicationId={app.id} jobTitle={app.job.title} />}
                  </div>
                  <ApplicationTimeline events={app.events} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}