import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { JOB_STATUSES, type JobStatus } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { listMyJobs } from "@/server/services/job.service";
import { requireRole } from "@/server/session";
import { JobRowActions } from "./job-row-actions";
import { Badge } from "@/components/ui/badge";

const TABS: { label: string; status?: JobStatus }[] = [
  { label: "All" }, { label: "Published", status: "PUBLISHED" }, { label: "Drafts", status: "DRAFT" }, { label: "Closed", status: "CLOSED" },
];

export default async function MyJobsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const user = await requireRole("EMPLOYER");
  const sp = await searchParams;
  // Never trust URL params: whitelist the status, clamp the page number
  const status = JOB_STATUSES.includes(sp.status as JobStatus) ? (sp.status as JobStatus) : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { items, totalPages, counts } = await listMyJobs(user.id, { status, page });
  const allCount = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const hrefFor = (p: number) => `/employer/jobs?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="My jobs" description="Drafts, live postings and closed roles."
        actions={<Button asChild><Link href="/employer/jobs/new">Post a job</Link></Button>} />

      <nav aria-label="Filter by status" className="mb-4 flex gap-1 overflow-x-auto border-b">
        {TABS.map((tab) => {
          const active = tab.status === status;
          const count = tab.status ? counts[tab.status] ?? 0 : allCount;
          return (
            <Link key={tab.label} href={tab.status ? `/employer/jobs?status=${tab.status}` : "/employer/jobs"}
              aria-current={active ? "page" : undefined}
              className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
                active ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab.label} <span className="tabular-nums text-muted-foreground">({count})</span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs here yet" description="Post your first job to start receiving applicants."
          action={<Button asChild size="sm"><Link href="/employer/jobs/new">Post a job</Link></Button>} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applicants</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-64 font-medium">
                    <span className="truncate">{job.title}</span>
                    {job.hires > 0 && (
                      <Badge variant="outline" className="ml-2 border-transparent bg-success/15 text-success">{job.hires} hired</Badge>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={job.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{job._count.applications}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{job.publishedAt ? timeAgo(job.publishedAt) : "Not published"}</TableCell>
                  <TableCell><JobRowActions job={{ id: job.id, slug: job.slug, status: job.status }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}