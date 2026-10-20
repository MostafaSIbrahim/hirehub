import { formatStatus } from "@/lib/application-status";
import { timeAgo } from "@/lib/format";

type TimelineEvent = { id: string; toStatus: string; createdAt: Date; note?: string | null };

export function ApplicationTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-3 border-l pl-4" aria-label="Application history">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-5.25 top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" aria-hidden />
          <p className="text-sm font-medium">
            {formatStatus(e.toStatus)} <span className="font-normal text-muted-foreground">· {timeAgo(e.createdAt)}</span>
          </p>
          {e.note && <p className="text-sm text-muted-foreground">“{e.note}”</p>}
        </li>
      ))}
    </ol>
  );
}