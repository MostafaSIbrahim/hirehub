import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  SUBMITTED: "bg-muted text-muted-foreground",
  REVIEWING: "bg-warning/15 text-warning",
  SHORTLISTED: "bg-primary/10 text-primary",
  INTERVIEW: "bg-warning/15 text-warning",
  OFFERED: "bg-success/15 text-success",
  HIRED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground line-through",
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-success/15 text-success",
  CLOSED: "bg-secondary text-secondary-foreground",
  REMOVED: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase(); // "SHORTLISTED" → "Shortlisted"
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", STYLES[status])}>
      {label}
    </Badge>
  );
}