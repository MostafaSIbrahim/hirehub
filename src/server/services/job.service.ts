import "server-only";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { slugify } from "@/lib/slug";
import type { JobStatus } from "@/lib/jobs";
import type { JobInput } from "@/lib/validators/job";

export const JOBS_PAGE_SIZE = 10;

/** One place that says "a job this employer owns". Every other function builds on it. */
const ownedBy = (ownerId: string, jobId: string) => ({ id: jobId, company: { ownerId } });

function toData(input: JobInput) {
  return {
    title: input.title,
    location: input.location,
    workMode: input.workMode,
    employmentType: input.employmentType,
    experienceLevel: input.experienceLevel,
    description: input.description,
    skills: [...new Set(input.skills)],
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    currency: input.currency,
  };
}

// ───────────── Reads ─────────────

export function findOwnedJob(ownerId: string, jobId: string) {
  return prisma.job.findFirst({ where: ownedBy(ownerId, jobId) });
}

async function getOwnedJob(ownerId: string, jobId: string) {
  const job = await findOwnedJob(ownerId, jobId);
  if (!job) throw new AppError("Job not found."); // not yours === doesn't exist
  return job;
}

export async function listMyJobs(ownerId: string, opts: { status?: JobStatus; page: number }) {
  const where = { company: { ownerId }, ...(opts.status ? { status: opts.status } : {}) };
  const [items, total, byStatus] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * JOBS_PAGE_SIZE, // paginate every list: architecture rule #5
      take: JOBS_PAGE_SIZE,
      select: {
        id: true, title: true, slug: true, status: true, publishedAt: true, createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
    prisma.job.groupBy({ by: ["status"], where: { company: { ownerId } }, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Partial<Record<JobStatus, number>>;
    // How many people were hired per job on this page (one query for all 10 rows, not 10 queries)
  const hired = await prisma.application.groupBy({
    by: ["jobId"],
    where: { jobId: { in: items.map((j) => j.id) }, status: "HIRED" },
    _count: { _all: true },
  });
  const hiresByJob = new Map(hired.map((r) => [r.jobId, r._count._all]));

  return {
    items: items.map((j) => ({ ...j, hires: hiresByJob.get(j.id) ?? 0 })),
    total,
    totalPages: Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE)),
    counts,
  };
}

/** Public job page. cache() → generateMetadata and the page share ONE query per request. */
export const getPublicJob = cache(async (slug: string) => {
  return prisma.job.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "CLOSED"] } }, // drafts & removed jobs are invisible
    include: {
      company: { select: { name: true, slug: true, website: true, location: true, size: true, description: true, verified: true } },
    },
  });
});

// ───────────── Writes ─────────────

export async function createJob(ownerId: string, input: JobInput, publish: boolean) {
  const company = await prisma.company.findUnique({ where: { ownerId }, select: { id: true } });
  if (!company) throw new AppError("Create your company profile first.");

  return prisma.job.create({
    data: {
      ...toData(input),
      companyId: company.id, // from the session's user, never from the form
      slug: `${slugify(input.title)}-${randomUUID().slice(0, 8)}`,
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? new Date() : null,
    },
  });
}

export async function updateJob(ownerId: string, jobId: string, input: JobInput) {
  const job = await getOwnedJob(ownerId, jobId);
  if (job.status === "REMOVED") throw new AppError("This job was removed by a moderator and can't be edited.");
  // slug is NOT updated: links people already shared must keep working
  return prisma.job.update({ where: { id: job.id }, data: toData(input) });
}

const TRANSITIONS = {
  publish: { from: ["DRAFT", "CLOSED"], to: "PUBLISHED" },
  close: { from: ["PUBLISHED"], to: "CLOSED" },
} as const satisfies Record<string, { from: readonly JobStatus[]; to: JobStatus }>;

export type JobAction = keyof typeof TRANSITIONS;

export async function changeJobStatus(ownerId: string, jobId: string, action: JobAction) {
  const job = await getOwnedJob(ownerId, jobId);
  const rule = TRANSITIONS[action];
  if (!(rule.from as readonly string[]).includes(job.status)) {
    throw new AppError(`You can't ${action} a ${job.status.toLowerCase()} job.`);
  }

  // Optimistic concurrency: only update if the status is STILL what we just read.
  // If someone (another tab, an admin) changed it in between, count is 0 and we refuse.
  const result = await prisma.job.updateMany({
    where: { id: job.id, status: job.status },
    data: {
      status: rule.to,
      ...(action === "publish" && !job.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
  if (result.count === 0) throw new AppError("This job was just changed elsewhere. Refresh and try again.");
  return job;
}

export async function deleteDraftJob(ownerId: string, jobId: string) {
  // Ownership AND state checked in the SAME query that deletes: nothing can change in between.
  const result = await prisma.job.deleteMany({ where: { ...ownedBy(ownerId, jobId), status: "DRAFT" } });
  if (result.count === 0) throw new AppError("Only your draft jobs can be deleted.");
}

export function listSavedJobs(userId: string) {
  return prisma.savedJob.findMany({
    // only jobs that are still live: removed/closed/draft would just lead to a 404
    where: { userId, job: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      createdAt: true,
      job: { select: { id: true, slug: true, title: true, location: true, company: { select: { name: true } } } },
    },
  });
}