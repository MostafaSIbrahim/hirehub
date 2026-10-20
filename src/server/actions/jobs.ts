"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { jobSchema, type JobInput } from "@/lib/validators/job";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session";
import { changeJobStatus, createJob, deleteDraftJob, updateJob, type JobAction } from "@/server/services/job.service";

const idSchema = z.cuid();

/** Runs a mutation and turns expected AppErrors into { error }; unexpected errors still throw. */
async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
  revalidatePath("/employer", "layout");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function createJobAction(input: JobInput, publish: boolean): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form fields." };
  return run(() => createJob(user.id, parsed.data, publish === true));
}

export async function updateJobAction(jobId: string, input: JobInput): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  const parsed = jobSchema.safeParse(input);
  if (!idSchema.safeParse(jobId).success || !parsed.success) return { error: "Please check the form fields." };
  return run(() => updateJob(user.id, jobId, parsed.data));
}

export async function setJobStatusAction(jobId: string, action: JobAction): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  if (!idSchema.safeParse(jobId).success || !z.enum(["publish", "close"]).safeParse(action).success) {
    return { error: "Invalid request." };
  }
  return run(() => changeJobStatus(user.id, jobId, action));
}

export async function deleteJobAction(jobId: string): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  if (!idSchema.safeParse(jobId).success) return { error: "Invalid request." };
  return run(() => deleteDraftJob(user.id, jobId));
}