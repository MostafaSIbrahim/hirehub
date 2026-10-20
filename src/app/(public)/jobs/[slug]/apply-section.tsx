import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { getSession } from "@/server/session";
import { getMyApplicationForJob } from "@/server/services/application.service";
import { getSeekerProfile } from "@/server/services/profile.service";
import { ApplyDialog } from "./apply-dialog";

export async function ApplySection({ jobId, jobTitle, closed }: { jobId: string; jobTitle: string; closed: boolean }) {
  if (closed) return <Button className="w-full" disabled>Applications closed</Button>;

  const session = await getSession();
  if (!session) return <Button asChild className="w-full"><Link href="/login">Log in to apply</Link></Button>;
  if (session.user.role !== "SEEKER") return <p className="text-center text-sm text-muted-foreground">Only job seeker accounts can apply.</p>;

  const [existing, profile] = await Promise.all([
    getMyApplicationForJob(session.user.id, jobId),
    getSeekerProfile(session.user.id),
  ]);

  if (existing) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm">You applied {timeAgo(existing.createdAt)}</p>
        <StatusBadge status={existing.status} />
        <Button asChild variant="outline" className="w-full"><Link href="/seeker/applications">View my applications</Link></Button>
      </div>
    );
  }
  if (!profile?.resumeUrl) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">Add your CV to your profile before applying.</p>
        <Button asChild className="w-full"><Link href="/seeker/profile">Upload CV</Link></Button>
      </div>
    );
  }
  return <ApplyDialog jobId={jobId} jobTitle={jobTitle} />;
}