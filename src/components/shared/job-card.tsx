import Link from "next/link";
import { BadgeCheck, Banknote, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatSalary, timeAgo } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/jobs";
import type { JobCardData } from "@/server/services/search.service";

export function JobCard({ job }: { job: JobCardData }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  return (
    <Card className="relative transition-colors hover:border-primary/40">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold">
              {/* after:inset-0 stretches this link over the whole card: one link, whole card clickable */}
              <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {job.title}
              </Link>
            </h2>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              {job.company.name}
              {job.company.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="Verified company" />}
            </p>
          </div>
          {job.isNew && <Badge className="bg-highlight text-highlight-foreground">New</Badge>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={job.workMode === "REMOTE" ? "default" : "secondary"}
            className={job.workMode === "REMOTE" ? "bg-highlight text-highlight-foreground" : ""}>
            {WORK_MODE_LABELS[job.workMode]}
          </Badge>
          <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          <Badge variant="secondary">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{job.location}</span>
          {salary && <span className="flex items-center gap-1"><Banknote className="size-3.5" aria-hidden />{salary}</span>}
          {job.publishedAt && <span>{timeAgo(job.publishedAt)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}