import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { dashboardPath, type Role } from "@/lib/roles";

/** One DB lookup per request, even if 5 components ask for the session. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Logged-in and active, or redirect to /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.status === "SUSPENDED") redirect("/login?error=suspended");
  return session.user;
}

/** Logged-in with one of the allowed roles, or redirect to *their own* dashboard. */
export async function requireRole(...allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role as Role)) redirect(dashboardPath(user.role));
  return user;
}