"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { ROLES } from "@/lib/roles";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session";
import { setJobRemoved, setUserRole, setUserStatus } from "@/server/services/admin.service";

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try { await fn(); } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

const id = z.string().min(1).max(64); // Better Auth user ids are not cuids, so just bound the length

export async function setUserStatusAction(userId: string, status: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const p = z.object({ userId: id, status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse({ userId, status });
  if (!p.success) return { error: "Invalid request." };
  return run(() => setUserStatus(admin.id, p.data.userId, p.data.status));
}

export async function setUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const p = z.object({ userId: id, role: z.enum(ROLES) }).safeParse({ userId, role });
  if (!p.success) return { error: "Invalid request." };
  return run(() => setUserRole(admin.id, p.data.userId, p.data.role));
}

export async function setJobRemovedAction(jobId: string, removed: boolean): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const p = z.object({ jobId: z.cuid(), removed: z.boolean() }).safeParse({ jobId, removed });
  if (!p.success) return { error: "Invalid request." };
  return run(() => setJobRemoved(admin.id, p.data.jobId, p.data.removed));
}