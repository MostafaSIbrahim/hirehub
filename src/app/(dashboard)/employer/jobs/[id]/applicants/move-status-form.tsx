"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import { employerNextStatuses, formatStatus, type ApplicationStatus } from "@/lib/application-status";
import { moveApplicationAction } from "@/server/actions/applications";

export function MoveStatusForm({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const router = useRouter();
  const options = employerNextStatuses(status); // SAME rules as the server: the UI only offers legal moves
  const [to, setTo] = useState(options[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  if (options.length === 0) return <p className="text-sm text-muted-foreground">Final status. No further changes.</p>;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await moveApplicationAction(applicationId, to, note);
          if ("error" in result) return void toast.error(result.error);
          toast.success(`Moved to ${formatStatus(to)}`);
          setNote("");
          router.refresh();
        });
      }}
    >
      <NativeSelect aria-label="New status" value={to} onChange={(e) => setTo(e.target.value as ApplicationStatus)}>
        {options.map((s) => <option key={s} value={s}>{s === "REJECTED" ? "Reject" : `Move to ${formatStatus(s)}`}</option>)}
      </NativeSelect>
      <Input aria-label="Internal note (optional)" placeholder="Internal note (optional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" size="sm" variant={to === "REJECTED" ? "destructive" : "default"} disabled={pending}>
        {pending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}