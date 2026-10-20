"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { APPLICATION_STATUSES } from "@/lib/application-status";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session";
import { applyToJob, moveApplication, withdrawApplication } from "@/server/services/application.service";

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
  revalidatePath("/seeker", "layout");
  revalidatePath("/employer", "layout");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function applyAction(jobId: string, coverLetter: string): Promise<ActionResult> {
  const user = await requireRole("SEEKER");
  const parsed = z.object({ jobId: z.cuid(), coverLetter: z.string().max(3000, "Cover letter is too long") })
    .safeParse({ jobId, coverLetter });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  return run(() => applyToJob(user.id, parsed.data.jobId, parsed.data.coverLetter));
}

export async function withdrawAction(applicationId: string): Promise<ActionResult> {
  const user = await requireRole("SEEKER");
  if (!z.cuid().safeParse(applicationId).success) return { error: "Invalid request." };
  return run(() => withdrawApplication(user.id, applicationId));
}

export async function moveApplicationAction(applicationId: string, to: string, note: string): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  const parsed = z.object({ applicationId: z.cuid(), to: z.enum(APPLICATION_STATUSES), note: z.string().max(500) })
    .safeParse({ applicationId, to, note });
  if (!parsed.success) return { error: "Invalid request." };
  return run(() => moveApplication(user.id, parsed.data.applicationId, parsed.data.to, parsed.data.note));
}