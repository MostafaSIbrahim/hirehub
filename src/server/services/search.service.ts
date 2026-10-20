import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import type { JobSearch } from "@/lib/job-search";

export const SEARCH_PAGE_SIZE = 10;
const DAY = 24 * 60 * 60 * 1000;

/** Users type % and _ too; in LIKE patterns they're wildcards, so escape them. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export async function searchJobs(f: JobSearch) {
  const page = f.page ?? 1;
  const sort = f.sort ?? (f.q ? "relevance" : "newest");
  const tsquery = f.q ? Prisma.sql`websearch_to_tsquery('english', ${f.q})` : null;

  // Every ${value} becomes a $1, $2… PARAMETER. Postgres receives values separately from the SQL,
  // so input like  '; DROP TABLE "Job"; --  is just a weird search term, never executed.
  const conditions: Prisma.Sql[] = [Prisma.sql`j."status" = 'PUBLISHED'`]; // removed/closed/draft never appear
  if (tsquery) conditions.push(Prisma.sql`j."search" @@ ${tsquery}`);
  if (f.mode) conditions.push(Prisma.sql`j."workMode" = ${f.mode}::"WorkMode"`);
  if (f.type) conditions.push(Prisma.sql`j."employmentType" = ${f.type}::"EmploymentType"`);
  if (f.level) conditions.push(Prisma.sql`j."experienceLevel" = ${f.level}::"ExperienceLevel"`);
  if (f.location) conditions.push(Prisma.sql`j."location" ILIKE ${`%${escapeLike(f.location)}%`}`);
  if (f.minSalary) conditions.push(Prisma.sql`COALESCE(j."salaryMax", j."salaryMin") >= ${f.minSalary}`);
  if (f.posted) conditions.push(Prisma.sql`j."publishedAt" >= ${new Date(Date.now() - Number(f.posted) * DAY)}`);

  const orderBy =
    sort === "salary"
      ? Prisma.sql`COALESCE(j."salaryMax", j."salaryMin") DESC NULLS LAST, j."publishedAt" DESC`
      : sort === "relevance" && tsquery
        ? Prisma.sql`ts_rank(j."search", ${tsquery}) DESC, j."publishedAt" DESC`
        : Prisma.sql`j."publishedAt" DESC`;

  // Step 1 (raw SQL): which IDs match, in what order, and how many in total.
  const rows = await prisma.$queryRaw<{ id: string; total: bigint }[]>`
    SELECT j."id", COUNT(*) OVER () AS "total"
    FROM "Job" j
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${orderBy}
    LIMIT ${SEARCH_PAGE_SIZE} OFFSET ${(page - 1) * SEARCH_PAGE_SIZE}
  `;
  const total = rows.length ? Number(rows[0].total) : 0;
  const ids = rows.map((r) => r.id);

  // Step 2 (Prisma): load those 10 jobs with fully typed relations.
  const jobs = ids.length
    ? await prisma.job.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, slug: true, title: true, location: true, workMode: true, employmentType: true,
          experienceLevel: true, salaryMin: true, salaryMax: true, currency: true, skills: true, publishedAt: true,
          company: { select: { name: true, verified: true } },
        },
      })
    : [];

  // `IN (...)` doesn't preserve order, so restore the ranking from step 1.
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const now = Date.now();
  const items = ids
    .map((id) => byId.get(id))
    .filter((j) => j !== undefined)
    .map((j) => ({ ...j, isNew: !!j.publishedAt && now - j.publishedAt.getTime() < 3 * DAY }));

  return { items, total, page, sort, totalPages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)) };
}

export type JobCardData = Awaited<ReturnType<typeof searchJobs>>["items"][number];

import { cacheLife } from "next/cache";

/** Same for every visitor → cached, refreshed every few minutes. */
export async function getPlatformStats() {
  "use cache";
  cacheLife("minutes");
  const [jobs, companies, seekers, hires] = await Promise.all([
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.company.count(),
    prisma.user.count({ where: { role: "SEEKER", status: "ACTIVE" } }),
    prisma.application.count({ where: { status: "HIRED" } }),
  ]);
  return { jobs, companies, seekers, hires };
}

export async function getLatestJobs() {
  "use cache";
  cacheLife("minutes");
  const { items } = await searchJobs({});
  return items.slice(0, 6);
}