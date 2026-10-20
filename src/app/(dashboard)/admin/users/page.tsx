import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/shared/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { ROLES, type Role } from "@/lib/roles";
import { listUsers } from "@/server/services/admin.service";
import { requireRole } from "@/server/session";
import { UserActions } from "../admin-actions";

type SP = Promise<{ q?: string; role?: string; status?: string; page?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SP }) {
  const admin = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const role = ROLES.includes(sp.role as Role) ? (sp.role as Role) : undefined;
  const status = sp.status === "ACTIVE" || sp.status === "SUSPENDED" ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { items, totalPages } = await listUsers({ q, role, status, page });
  const hrefFor = (p: number) =>
    `/admin/users?${new URLSearchParams({ ...(q && { q }), ...(role && { role }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Users" description="Search, suspend and change roles." />

      {/* Plain HTML GET form: submitting puts the fields in the URL. No JavaScript, no state. */}
      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users" className="w-64" />
        <NativeSelect name="role" defaultValue={role ?? ""} aria-label="Role" className="w-36">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={status ?? ""} aria-label="Status" className="w-36">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </NativeSelect>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={Users} title="No users match" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead>
                <TableHead>Joined</TableHead><TableHead className="text-right">Role & actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(u.createdAt)}</TableCell>
                  <TableCell><UserActions user={u} isSelf={u.id === admin.id} /></TableCell>
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