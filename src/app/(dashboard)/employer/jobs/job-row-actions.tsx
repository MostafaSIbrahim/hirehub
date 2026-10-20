"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ActionResult } from "@/lib/action-result";
import { deleteJobAction, setJobStatusAction } from "@/server/actions/jobs";

export function JobRowActions({ job }: { job: { id: string; slug: string; status: string } }) {
  const router = useRouter();
  async function run(action: Promise<ActionResult>, success: string) {
    const result = await action;
    if ("error" in result) return void toast.error(result.error);
    toast.success(success);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      {job.status !== "DRAFT" && (
        <Button asChild variant="ghost" size="sm"><Link href={`/jobs/${job.slug}`}>View</Link></Button>
      )}
      <Button asChild variant="ghost" size="sm"><Link href={`/employer/jobs/${job.id}/edit`}>Edit</Link></Button>

      {(job.status === "DRAFT" || job.status === "CLOSED") && (
        <Button variant="outline" size="sm" onClick={() => run(setJobStatusAction(job.id, "publish"), job.status === "DRAFT" ? "Job published" : "Job reopened")}>
          {job.status === "DRAFT" ? "Publish" : "Reopen"}
        </Button>
      )}
      {job.status === "PUBLISHED" && (
        <ConfirmDialog
          trigger={<Button variant="outline" size="sm">Close</Button>}
          title="Close this job?"
          description="It stops accepting applications and disappears from search. You can reopen it later."
          confirmLabel="Close job"
          onConfirm={() => run(setJobStatusAction(job.id, "close"), "Job closed")}
        />
      )}
      {job.status === "DRAFT" && (
        <ConfirmDialog
          trigger={<Button variant="ghost" size="sm" className="text-destructive">Delete</Button>}
          title="Delete this draft?"
          description="This can't be undone."
          confirmLabel="Delete draft"
          destructive
          onConfirm={() => run(deleteJobAction(job.id), "Draft deleted")}
        />
      )}
    </div>
  );
}