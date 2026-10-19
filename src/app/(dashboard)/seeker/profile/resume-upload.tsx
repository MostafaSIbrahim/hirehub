"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_RESUME_BYTES } from "@/lib/validators/profile";

export function ResumeUpload({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    // Quick client-side checks for instant feedback; the SERVER checks again for real.
    if (file.type !== "application/pdf") return void toast.error("Only PDF files are allowed.");
    if (file.size > MAX_RESUME_BYTES) return void toast.error("The file must be 5 MB or smaller.");

    setPending(true);
    const body = new FormData();
    body.append("resume", file);
    const res = await fetch("/api/resumes", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) return void toast.error(data.error ?? "Upload failed.");
    toast.success("CV uploaded");
    router.refresh(); // re-render server components so the new CV link + completeness show
  }

  return (
    <Card>
      <CardHeader><CardTitle>CV</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {currentUrl ? (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <FileText className="size-4" aria-hidden /> View current CV
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No CV yet. You will need one to apply.</p>
        )}
        <input ref={inputRef} type="file" accept="application/pdf" className="sr-only" onChange={onFileChosen} aria-label="Upload CV (PDF)" />
        <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" aria-hidden /> {pending ? "Uploading…" : currentUrl ? "Replace CV" : "Upload CV"}
        </Button>
        <p className="text-xs text-muted-foreground">PDF only, up to 5 MB.</p>
      </CardContent>
    </Card>
  );
}