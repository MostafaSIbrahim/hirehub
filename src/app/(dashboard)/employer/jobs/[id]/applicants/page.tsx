import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationTimeline } from "@/components/shared/application-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { APPLICATION_STATUSES, formatStatus, type ApplicationStatus } from "@/lib/application-status";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listApplicantsForJob } from "@/server/services/application.service";
import { requireRole } from "@/server/session";
import { MoveStatusForm } from "./move-status-form";

const FILTERS: (ApplicationStatus | undefined)[] = [undefined, "SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];

export default async function ApplicantsPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const user = await requireRole("EMPLOYER");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const status = APPLICATION_STATUSES.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;

  const data = await listApplicantsForJob(user.id, id, status);
  if (!data) notFound(); // not your job → 404
  const { job, applicants } = data;

  return (
    <>
      <PageHeader title="Applicants" description={job.title}
        actions={<Button asChild variant="outline"><Link href={`/jobs/${job.slug}`}>View job</Link></Button>} />

      <nav aria-label="Filter by status" className="mb-4 flex gap-1 overflow-x-auto border-b">
        {FILTERS.map((f) => (
          <Link key={f ?? "all"} href={f ? `?status=${f}` : "?"} aria-current={f === status ? "page" : undefined}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
              f === status ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {f ? formatStatus(f) : "All"}
          </Link>
        ))}
      </nav>

      {applicants.length === 0 ? (
        <EmptyState icon={Users} title="No applicants here" description="Applicants for this job will appear in this list." />
      ) : (
        <ul className="space-y-4">
          {applicants.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_14rem_15rem]">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.seeker.name}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {a.seeker.seekerProfile?.headline ?? "No headline"} · {a.seeker.seekerProfile?.experienceYears ?? 0} yrs
                      · applied {timeAgo(a.createdAt)}
                    </p>
                    <p className="text-sm"><a href={`mailto:${a.seeker.email}`} className="text-primary hover:underline">{a.seeker.email}</a></p>
                    {!!a.seeker.seekerProfile?.skills.length && (
                      <div className="flex flex-wrap gap-1">{a.seeker.seekerProfile.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                    )}
                    <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <FileText className="size-4" aria-hidden /> View CV
                    </a>
                    {a.coverLetter && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">Cover letter</summary>
                        <p className="mt-2 whitespace-pre-line">{a.coverLetter}</p>
                      </details>
                    )}
                  </div>
                  <ApplicationTimeline events={a.events} />
                  <MoveStatusForm key={a.status} applicationId={a.id} status={a.status} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}