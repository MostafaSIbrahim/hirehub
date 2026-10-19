"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/session";
import { upsertSeekerProfile } from "@/server/services/profile.service";
import { upsertCompany } from "@/server/services/company.service";
import { companySchema, seekerProfileSchema, type CompanyInput, type SeekerProfileInput } from "@/lib/validators/profile";

type ActionResult = { ok: true } | { error: string };

export async function updateSeekerProfileAction(input: SeekerProfileInput): Promise<ActionResult> {
  const user = await requireRole("SEEKER"); // layer 3: actions re-check, always
  const parsed = seekerProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form fields." };
  await upsertSeekerProfile(user.id, parsed.data);
  revalidatePath("/seeker", "layout"); // refresh the profile page AND the dashboard
  return { ok: true };
}

export async function saveCompanyAction(input: CompanyInput): Promise<ActionResult> {
  const user = await requireRole("EMPLOYER");
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form fields." };
  await upsertCompany(user.id, parsed.data);
  revalidatePath("/employer", "layout");
  return { ok: true };
}