import "server-only";
import { prisma } from "@/server/db";

const DAY = 24 * 60 * 60 * 1000;

// ───────────── Seeker ─────────────
export async function getSeekerDashboard(userId: string) {
  // Three independent queries → run them in parallel, not one after another.
  const [byStatus, saved, recent] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { seekerId: userId },
      _count: { _all: true },
    }),
    prisma.savedJob.count({ where: { userId, job: { status: "PUBLISHED" } } }),
    prisma.application.findMany({
      where: { seekerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: { select: { title: true, slug: true, company: { select: { name: true } } } },
      },
    }),
  ]);

  const count = (...statuses: string[]) =>
    byStatus
      .filter((row) => statuses.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);

  return {
    stats: {
      total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
      inReview: count("SUBMITTED", "REVIEWING", "SHORTLISTED"), // ← the business rule, defined once
      interviews: count("INTERVIEW"),
      saved,
    },
    recent,
  };
}

// ───────────── Employer ─────────────
export async function getEmployerDashboard(userId: string) {
  const company = await prisma.company.findUnique({
    where: { ownerId: userId },
    select: { id: true, name: true },
  });
  if (!company) return { company: null } as const; // a brand-new employer has no company yet

  const ofMyCompany = { job: { companyId: company.id } }; // ownership filter, reused everywhere below
  const weekAgo = new Date(Date.now() - 7 * DAY);

  const [activeJobs, totalApplicants, newThisWeek, hires, latest] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "PUBLISHED" } }),
    prisma.application.count({ where: ofMyCompany }),
    prisma.application.count({ where: { ...ofMyCompany, createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { ...ofMyCompany, status: "HIRED" } }),
    prisma.application.findMany({
      where: ofMyCompany,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        seeker: { select: { name: true } },
        job: { select: { title: true } },
      },
    }),
  ]);

  return { company, stats: { activeJobs, totalApplicants, newThisWeek, hires }, latest };
}

// ───────────── Admin ─────────────
export async function getAdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [usersByRole, publishedJobs, applicationsToday, unverifiedCompanies, recentAudit] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.application.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.company.count({ where: { verified: false } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const roleCount = (role: string) => usersByRole.find((r) => r.role === role)?._count._all ?? 0;

  return {
    stats: {
      users: usersByRole.reduce((sum, r) => sum + r._count._all, 0),
      seekers: roleCount("SEEKER"),
      employers: roleCount("EMPLOYER"),
      publishedJobs,
      applicationsToday,
      unverifiedCompanies,
    },
    recentAudit,
  };
}