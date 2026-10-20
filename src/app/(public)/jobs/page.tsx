import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { JobCard } from "@/components/shared/job-card";
import { Pagination } from "@/components/shared/pagination";
import { buildJobsHref, parseJobSearch } from "@/lib/job-search";
import { searchJobs } from "@/server/services/search.service";
import { JobFilters, MobileFilters, SortSelect } from "./job-filters";
import { SearchBox } from "./search-box";

export const metadata = { title: "Find jobs · HireHub", description: "Search open roles by skill, location, salary and more." };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<JobsSkeleton />}>
      <JobsResults searchParams={searchParams} />
    </Suspense>
  );
}

async function JobsResults({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseJobSearch(await searchParams);
  const { items, total, page, totalPages } = await searchJobs(filters);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Find your next role</h1>
        <SearchBox filters={filters} />
      </div>

      <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
        <aside className="hidden md:block">
          <Card><CardContent className="p-5"><JobFilters filters={filters} /></CardContent></Card>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-2">
            {/* aria-live: screen readers announce the new count after each search */}
            <h2 id="results-heading" aria-live="polite" className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{total}</span> {total === 1 ? "job" : "jobs"}
              {filters.q && <> for "<span className="font-medium text-foreground">{filters.q}</span>"</>}
            </h2>
            <div className="flex items-center gap-2">
              <MobileFilters filters={filters} />
              <SortSelect filters={filters} hasQuery={!!filters.q} />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={SearchX} title="No jobs match your search"
              description="Try fewer filters or a broader keyword."
              action={<Button asChild variant="outline" size="sm"><Link href="/jobs">Clear search</Link></Button>} />
          ) : (
            <ul className="space-y-3">
              {items.map((job) => <li key={job.id}><JobCard job={job} /></li>)}
            </ul>
          )}

          <Pagination page={page} totalPages={totalPages} hrefFor={(p) => buildJobsHref(filters, { page: p })} />
        </section>
      </div>
    </div>
  );
}

function JobsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
        <Skeleton className="hidden h-96 rounded-xl md:block" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      </div>
    </div>
  );
}