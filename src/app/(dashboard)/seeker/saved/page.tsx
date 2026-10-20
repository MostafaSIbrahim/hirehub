import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { timeAgo } from "@/lib/format";
import { listSavedJobs } from "@/server/services/job.service";
import { requireRole } from "@/server/session";

export default async function SavedJobsPage() {
  const user = await requireRole("SEEKER");
  const saved = await listSavedJobs(user.id);

  return (
    <>
      <PageHeader title="Saved jobs" description="Roles you bookmarked to come back to." />
      {saved.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved jobs" description="Jobs you save will appear here."
          action={<Button asChild size="sm"><Link href="/jobs">Browse jobs</Link></Button>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {saved.map(({ job, createdAt }) => (
            <li key={job.id}>
              <Card className="relative transition-colors hover:border-primary/40">
                <CardContent className="space-y-1 p-5">
                  <Link href={`/jobs/${job.slug}`} className="font-semibold after:absolute after:inset-0">{job.title}</Link>
                  <p className="text-sm text-muted-foreground">{job.company.name} · {job.location}</p>
                  <p className="text-xs text-muted-foreground">Saved {timeAgo(createdAt)}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}