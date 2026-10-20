"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyAction } from "@/server/actions/applications";

const MAX = 3000;

export function ApplyDialog({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await applyAction(jobId, coverLetter);
      if ("error" in result) return void toast.error(result.error);
      toast.success("Application sent! Good luck.");
      setOpen(false);
      router.refresh(); // the apply card switches to "Applied · Submitted"
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full">Apply now</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>We will send the CV from your profile. A short cover letter helps you stand out.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="coverLetter">Cover letter (optional)</Label>
          <Textarea id="coverLetter" rows={7} maxLength={MAX} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} aria-describedby="cl-count" />
          <p id="cl-count" className="text-right text-xs text-muted-foreground tabular-nums">{coverLetter.length}/{MAX}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? "Sending…" : "Send application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}