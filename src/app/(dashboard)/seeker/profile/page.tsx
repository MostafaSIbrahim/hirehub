import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getSeekerProfile, profileCompleteness } from "@/server/services/profile.service";
import { requireRole } from "@/server/session";
import { ProfileForm } from "./profile-form";
import { ResumeUpload } from "./resume-upload";

export default async function SeekerProfilePage() {
  const user = await requireRole("SEEKER");
  const profile = await getSeekerProfile(user.id);
  const completeness = profileCompleteness(profile);

  return (
    <>
      <PageHeader title="Your profile" description="Employers see this when you apply." />

      <Card className="mb-6">
        <CardContent className="space-y-2 p-5">
          <div className="flex justify-between text-sm">
            <span>Profile completeness</span>
            <span className="font-medium tabular-nums">{completeness}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar" aria-label="Profile completeness"
            aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Only plain values cross into the client component */}
          <ProfileForm
            defaults={{
              headline: profile?.headline ?? "",
              location: profile?.location ?? "",
              experienceYears: profile?.experienceYears ?? 0,
              skills: profile?.skills.join(", ") ?? "",
              bio: profile?.bio ?? "",
            }}
          />
        </div>
        <ResumeUpload currentUrl={profile?.resumeUrl ?? null} />
      </div>
    </>
  );
}