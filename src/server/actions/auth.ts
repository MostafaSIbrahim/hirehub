"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { dashboardPath } from "@/lib/roles";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validators/auth";

type ActionResult = { error: string } | undefined;

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input); // never trust the client
  if (!parsed.success) return { error: "Please check the form fields." };
  const { name, email, password, role } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
    // role has input:false, so we set it here, server-side, from the validated value
    await prisma.user.update({ where: { id: result.user.id }, data: { role } });
  } catch (error) {
    if (error instanceof APIError) return { error: error.message };
    throw error;
  }

  redirect(dashboardPath(role)); // OUTSIDE try/catch — see note below
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form fields." };

  let role: string;
  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.user.id },
      select: { role: true },
    });
    role = user.role;
  } catch (error) {
    if (error instanceof APIError) return { error: error.message };
    throw error;
  }

  redirect(dashboardPath(role));
}

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}