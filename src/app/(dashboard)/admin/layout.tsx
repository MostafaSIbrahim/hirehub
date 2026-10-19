import { Suspense } from "react";
import { DashboardGuard } from "@/components/shared/dashboard-guard";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardGuard role="ADMIN">{children}</DashboardGuard>
    </Suspense>
  );
}