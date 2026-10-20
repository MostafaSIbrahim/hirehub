import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/shared/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatStatus } from "@/lib/application-status";
import { timeAgo } from "@/lib/format";
import { JOB_STATUSES, type JobStatus } from "@/lib/jobs";
import { listJobsForModeration } from "@/server/services/admin.service";
import { requireRole } from "@/server/session";
import { JobModerationActions } from "../admin-actions";

type SP = Promise<{ q?: string; status?: string; page?: string }>;

export default async function AdminJobsPage({ searchParams }: { searchParams: SP }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const status = JOB_STATUSES.includes(sp.status as JobStatus) ? (sp.status as JobStatus) : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { items, totalPages } = await listJobsForModeration({ q, status, page });
  const hrefFor = (p: number) =>
    `/admin/jobs?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Jobs" description="Moderate job postings across all companies." />

      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search title or company" aria-label="Search jobs" className="w-64" />
        <NativeSelect name="status" defaultValue={status ?? ""} aria-label="Status" className="w-40">
          <option value="">Any status</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </NativeSelect>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No jobs match" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((job) => {
                // Only published/closed jobs have a public page; links to drafts/removed would 404
                const isPublic = job.status === "PUBLISHED" || job.status === "CLOSED";
                return (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-64 truncate font-medium">
                      {isPublic ? <Link href={`/jobs/${job.slug}`} className="hover:underline">{job.title}</Link> : job.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{job.company.name}</TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(job.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <JobModerationActions job={{ id: job.id, title: job.title, status: job.status }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}