"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NativeSelect } from "@/components/shared/native-select";
import type { ActionResult } from "@/lib/action-result";
import { ROLES } from "@/lib/roles";
import { setJobRemovedAction, setUserRoleAction, setUserStatusAction } from "@/server/actions/admin";

function useRun() {
  const router = useRouter();
  return async (action: Promise<ActionResult>, success: string) => {
    const result = await action;
    if ("error" in result) return void toast.error(result.error);
    toast.success(success);
    router.refresh();
  };
}

export function UserActions({ user, isSelf }: { user: { id: string; name: string; role: string; status: string }; isSelf: boolean }) {
  const run = useRun();
  if (isSelf) return <span className="text-sm text-muted-foreground">You</span>;
  const suspended = user.status === "SUSPENDED";

  return (
    <div className="flex items-center justify-end gap-2">
      <NativeSelect
        aria-label={`Role for ${user.name}`}
        className="h-8 w-32"
        key={user.role}
        defaultValue={user.role}
        onChange={(e) => {
          const role = e.target.value;
          if (!window.confirm(`Change ${user.name}'s role to ${role}?`)) {
            e.target.value = user.role; // cancelled → put the select back
            return;
          }
          void run(setUserRoleAction(user.id, role), "Role updated");
        }}
      >
        {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
      </NativeSelect>

      {suspended ? (
        <Button size="sm" variant="outline" onClick={() => run(setUserStatusAction(user.id, "ACTIVE"), "User reactivated")}>Reactivate</Button>
      ) : (
        <ConfirmDialog
          trigger={<Button size="sm" variant="ghost" className="text-destructive">Suspend</Button>}
          title={`Suspend ${user.name}?`}
          description="They are logged out everywhere immediately and can't log in until reactivated."
          confirmLabel="Suspend user"
          destructive
          onConfirm={() => run(setUserStatusAction(user.id, "SUSPENDED"), "User suspended")}
        />
      )}
    </div>
  );
}

export function JobModerationActions({ job }: { job: { id: string; title: string; status: string } }) {
  const run = useRun();
  if (job.status === "REMOVED") {
    return <Button size="sm" variant="outline" onClick={() => run(setJobRemovedAction(job.id, false), "Job restored (as closed)")}>Restore</Button>;
  }
  return (
    <ConfirmDialog
      trigger={<Button size="sm" variant="ghost" className="text-destructive">Remove</Button>}
      title={`Remove "${job.title}"?`}
      description="It disappears from search and the employer can't edit it. You can restore it later as a closed job."
      confirmLabel="Remove job"
      destructive
      onConfirm={() => run(setJobRemovedAction(job.id, true), "Job removed")}
    />
  );
}