import { Suspense } from "react";
import { DashboardGuard } from "@/components/shared/dashboard-guard";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardGuard role="EMPLOYER">{children}</DashboardGuard>
    </Suspense>
  );
}