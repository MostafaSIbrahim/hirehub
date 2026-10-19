import { PageHeader } from "@/components/shared/page-header";
import { getCompanyForOwner } from "@/server/services/company.service";
import { requireRole } from "@/server/session";
import { CompanyForm } from "./company-form";

export default async function CompanyPage() {
  const user = await requireRole("EMPLOYER");
  const company = await getCompanyForOwner(user.id);

  return (
    <>
      <PageHeader
        title={company ? "Company profile" : "Create your company"}
        description="Shown to candidates on every job you post."
      />
      <CompanyForm
        isNew={!company}
        defaults={{
          name: company?.name ?? "",
          website: company?.website ?? "",
          location: company?.location ?? "",
          size: (company?.size ?? "") as "",
          description: company?.description ?? "",
        }}
      />
    </>
  );
}