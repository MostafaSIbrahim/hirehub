"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { withdrawAction } from "@/server/actions/applications";

export function WithdrawButton({ applicationId, jobTitle }: { applicationId: string; jobTitle: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={<Button variant="ghost" size="sm" className="text-destructive">Withdraw</Button>}
      title={`Withdraw from ${jobTitle}?`}
      description="The employer will no longer consider your application. You can't re-apply to this job."
      confirmLabel="Withdraw"
      destructive
      onConfirm={async () => {
        const result = await withdrawAction(applicationId);
        if ("error" in result) return void toast.error(result.error);
        toast.success("Application withdrawn");
        router.refresh();
      }}
    />
  );
}