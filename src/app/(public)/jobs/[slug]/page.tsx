import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Banknote, Briefcase, Clock, Globe, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSalary, timeAgo } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/jobs";
import { getPublicJob } from "@/server/services/job.service";
import { ApplySection } from "./apply-section";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJob(slug); // same request as the page → cache() makes it one query
  if (!job) return { title: "Job not found · HireHub" };
  return {
    title: `${job.title} at ${job.company.name} · HireHub`,
    description: job.description.slice(0, 160),
  };
}

export default function JobPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<JobSkeleton />}>
      <JobDetail params={params} />
    </Suspense>
  );
}

async function JobDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const job = await getPublicJob(slug);
  if (!job) notFound();

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const closed = job.status === "CLOSED";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
              <p className="text-muted-foreground">{job.company.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={job.workMode === "REMOTE" ? "bg-highlight text-highlight-foreground" : ""} variant={job.workMode === "REMOTE" ? "default" : "secondary"}>
                {WORK_MODE_LABELS[job.workMode]}
              </Badge>
              <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
              <Badge variant="secondary">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
            </div>
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />{job.location}</li>
              {salary && <li className="flex items-center gap-2"><Banknote className="size-4" aria-hidden />{salary}</li>}
              {job.publishedAt && <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden />Posted {timeAgo(job.publishedAt)}</li>}
            </ul>
          </CardContent>
        </Card>

        {closed && (
          <p role="status" className="rounded-lg border bg-muted p-4 text-sm">This job is no longer accepting applications.</p>
        )}

        <Card>
          <CardHeader><CardTitle>About the role</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Plain text + whitespace-pre-line: line breaks show, but no HTML is ever interpreted (safe from XSS) */}
            <p className="whitespace-pre-line leading-relaxed">{job.description}</p>
            {job.skills.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-medium">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardContent className="space-y-3 p-6">
            <Suspense fallback={<Button className="w-full" disabled>Apply now</Button>}>
              <ApplySection jobId={job.id} jobTitle={job.title} closed={closed} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {job.company.name}
              {job.company.verified && <BadgeCheck className="size-4 text-primary" aria-label="Verified company" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {job.company.description && <p className="line-clamp-5 text-muted-foreground">{job.company.description}</p>}
            {job.company.location && <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />{job.company.location}</p>}
            {job.company.size && <p className="flex items-center gap-2"><Briefcase className="size-4" aria-hidden />{job.company.size} employees</p>}
            {job.company.website && (
              <a href={job.company.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 text-primary hover:underline">
                <Globe className="size-4" aria-hidden />Website
              </a>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}