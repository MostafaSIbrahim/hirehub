import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanyForOwner } from "@/server/services/company.service";
import { requireRole } from "@/server/session";
import { JobForm } from "../job-form";

export default async function NewJobPage() {
  const user = await requireRole("EMPLOYER");
  const company = await getCompanyForOwner(user.id);
  if (!company) {
    return (
      <EmptyState icon={Building2} title="Create your company first" description="Every job belongs to a company."
        action={<Button asChild><Link href="/employer/company">Set up company</Link></Button>} />
    );
  }
  return (
    <>
      <PageHeader title="Post a job" description={`Posting as ${company.name}`} />
      <JobForm
        mode="create"
        defaults={{
          title: "", location: company.location ?? "", workMode: "ONSITE", employmentType: "FULL_TIME",
          experienceLevel: "MID", description: "", skills: [], salaryMin: undefined, salaryMax: undefined, currency: "USD",
        }}
      />
    </>
  );
}