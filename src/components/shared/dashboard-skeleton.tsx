import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true" aria-label="Loading dashboard">
      <aside className="hidden w-64 shrink-0 space-y-3 border-r bg-card p-4 md:block">
        <Skeleton className="mb-6 h-6 w-28" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </aside>
      <div className="flex-1">
        <div className="flex h-14 items-center justify-end border-b bg-card px-4">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}