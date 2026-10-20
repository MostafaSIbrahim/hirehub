import { ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/format";
import { listAuditLog } from "@/server/services/admin.service";
import { requireRole } from "@/server/session";

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: "Suspended user", USER_REACTIVATED: "Reactivated user", USER_ROLE_CHANGED: "Changed role of",
  JOB_REMOVED: "Removed job", JOB_RESTORED: "Restored job",
};

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole("ADMIN");
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const { items, totalPages } = await listAuditLog(page);

  return (
    <>
      <PageHeader title="Audit log" description="Every admin action, newest first. Entries are never edited or deleted." />
      {items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No admin actions yet" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>When</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.map((log) => {
                const meta = log.metadata as { from?: string; to?: string } | null;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground" title={log.createdAt.toISOString()}>{timeAgo(log.createdAt)}</TableCell>
                    <TableCell>{log.actorName}</TableCell>
                    <TableCell><span className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</span> {log.target}</TableCell>
                    <TableCell className="text-muted-foreground">{meta?.from && meta?.to ? `${meta.from} → ${meta.to}` : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/admin/audit?page=${p}`} />
    </>
  );
}