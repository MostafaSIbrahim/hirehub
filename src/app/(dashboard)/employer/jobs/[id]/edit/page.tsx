import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { findOwnedJob } from "@/server/services/job.service";
import { requireRole } from "@/server/session";
import type { JobInput } from "@/lib/validators/job";
import { JobForm } from "../../job-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("EMPLOYER");
  const { id } = await params; // fine here: we're inside DashboardGuard's <Suspense>
  const job = await findOwnedJob(user.id, id);
  if (!job || job.status === "REMOVED") notFound(); // someone else's job → 404

  return (
    <>
      <PageHeader title="Edit job" description={job.title} />
      <JobForm
        mode="edit"
        jobId={job.id}
        defaults={{
          title: job.title, location: job.location,
          workMode: job.workMode, employmentType: job.employmentType, experienceLevel: job.experienceLevel,
          description: job.description, skills: job.skills,
          salaryMin: job.salaryMin ?? undefined, salaryMax: job.salaryMax ?? undefined,
          currency: job.currency as JobInput["currency"],
        }}
      />
    </>
  );
}