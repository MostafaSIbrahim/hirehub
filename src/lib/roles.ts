export const ROLES = ["SEEKER", "EMPLOYER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Where each role "lives" after login. A missing role falls back to the least-privileged dashboard. */
export function dashboardPath(role: string | null | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYER") return "/employer";
  return "/seeker";
}