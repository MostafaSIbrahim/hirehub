import "server-only";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import type { Role } from "@/lib/roles";
import type { JobStatus } from "@/lib/jobs";

export const ADMIN_PAGE_SIZE = 20;
const ci = (q: string) => ({ contains: q, mode: "insensitive" as const }); // case-insensitive "contains"
const pages = (total: number) => Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

// ───────────── Users ─────────────

export async function listUsers(f: { q?: string; role?: Role; status?: "ACTIVE" | "SUSPENDED"; page: number }) {
  const where = {
    ...(f.q ? { OR: [{ name: ci(f.q) }, { email: ci(f.q) }] } : {}),
    ...(f.role ? { role: f.role } : {}),
    ...(f.status ? { status: f.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, totalPages: pages(total) };
}

export async function setUserStatus(adminId: string, userId: string, status: "ACTIVE" | "SUSPENDED") {
  if (adminId === userId) throw new AppError("You can't change your own status."); // no locking yourself out
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw new AppError("User not found.");
  if (user.status === status) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    // Suspending deletes their sessions → logged out EVERYWHERE, right now, not at session expiry
    ...(status === "SUSPENDED" ? [prisma.session.deleteMany({ where: { userId } })] : []),
    prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
        entityType: "User", entityId: userId,
        metadata: { from: user.status, to: status },
      },
    }),
  ]);
}

export async function setUserRole(adminId: string, userId: string, role: Role) {
  if (adminId === userId) throw new AppError("You can't change your own role.");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new AppError("User not found.");
  if (user.role === role) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role } }),
    prisma.auditLog.create({
      data: { actorId: adminId, action: "USER_ROLE_CHANGED", entityType: "User", entityId: userId, metadata: { from: user.role, to: role } },
    }),
  ]);
}

// ───────────── Jobs ─────────────

export async function listJobsForModeration(f: { q?: string; status?: JobStatus; page: number }) {
  const where = {
    ...(f.q ? { OR: [{ title: ci(f.q) }, { company: { name: ci(f.q) } }] } : {}),
    ...(f.status ? { status: f.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE,
      select: { id: true, title: true, slug: true, status: true, createdAt: true, company: { select: { name: true } } },
    }),
    prisma.job.count({ where }),
  ]);
  return { items, totalPages: pages(total) };
}

export async function setJobRemoved(adminId: string, jobId: string, removed: boolean) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } });
  if (!job) throw new AppError("Job not found.");
  if (removed && job.status === "REMOVED") throw new AppError("This job is already removed.");
  if (!removed && job.status !== "REMOVED") throw new AppError("Only removed jobs can be restored.");

  // Restore → CLOSED, never straight back to PUBLISHED: the employer decides if it goes live again.
  const to = removed ? "REMOVED" : "CLOSED";
  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { status: to } }),
    prisma.auditLog.create({
      data: { actorId: adminId, action: removed ? "JOB_REMOVED" : "JOB_RESTORED", entityType: "Job", entityId: jobId, metadata: { from: job.status, to } },
    }),
  ]);
}

// ───────────── Audit log ─────────────

export async function listAuditLog(page: number) {
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
    prisma.auditLog.count(),
  ]);

  // AuditLog has no foreign keys, so we look up names ourselves (2 queries for the whole page, not N+1)
  const userIds = [...new Set([...items.map((i) => i.actorId), ...items.filter((i) => i.entityType === "User").map((i) => i.entityId)])];
  const jobIds = items.filter((i) => i.entityType === "Job").map((i) => i.entityId);
  const [users, jobs] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
    prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } }),
  ]);
  const userName = new Map(users.map((u) => [u.id, u.name]));
  const jobTitle = new Map(jobs.map((j) => [j.id, j.title]));

  return {
    items: items.map((i) => ({
      ...i,
      actorName: userName.get(i.actorId) ?? "Deleted user",
      target: (i.entityType === "User" ? userName.get(i.entityId) : jobTitle.get(i.entityId)) ?? "Deleted record",
    })),
    totalPages: pages(total),
  };
}