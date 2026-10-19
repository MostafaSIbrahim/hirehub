import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}