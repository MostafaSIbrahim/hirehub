import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { saveFile } from "@/server/storage";
import type { SeekerProfileInput } from "@/lib/validators/profile";


const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());

/** "React, typescript,react , Next.js" → ["React", "typescript", "Next.js"] */
function parseSkills(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
    .slice(0, 20);
}

export function getSeekerProfile(userId: string) {
  return prisma.seekerProfile.findUnique({ where: { userId } });
}

type ProfileLike = {
  headline: string | null; bio: string | null; location: string | null;
  skills: string[]; experienceYears: number; resumeUrl: string | null;
} | null;

export function profileCompleteness(p: ProfileLike): number {
  if (!p) return 0;
  const checks = [!!p.headline, !!p.bio, !!p.location, p.skills.length > 0, p.experienceYears > 0, !!p.resumeUrl];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function upsertSeekerProfile(userId: string, input: SeekerProfileInput) {
  const data = {
    headline: emptyToNull(input.headline),
    location: emptyToNull(input.location),
    bio: emptyToNull(input.bio),
    experienceYears: input.experienceYears,
    skills: parseSkills(input.skills),
  };
  // upsert = "update if it exists, create if it doesn't": one query, no race between check and insert
  return prisma.seekerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function saveResume(userId: string, bytes: Uint8Array): Promise<string> {
  const name = `${randomUUID()}.pdf`; // random, unguessable name, never the user's original filename
  await saveFile(`resumes/${name}`, bytes);
  const url = `/api/resumes/${name}`;
  await prisma.seekerProfile.upsert({
    where: { userId },
    create: { userId, resumeUrl: url },
    update: { resumeUrl: url },
  });
  return url;
}

/** Who may download a CV: its owner, an employer the seeker applied to, or an admin. */
export async function canViewResume(user: { id: string; role?: string | null }, url: string) {
  if (user.role === "ADMIN") return true;
  const [ownProfile, ownApplication, applicationToMyCompany] = await Promise.all([
    prisma.seekerProfile.count({ where: { userId: user.id, resumeUrl: url } }),
    prisma.application.count({ where: { seekerId: user.id, resumeUrl: url } }),
    prisma.application.count({ where: { resumeUrl: url, job: { company: { ownerId: user.id } } } }),
  ]);
  return ownProfile > 0 || ownApplication > 0 || applicationToMyCompany > 0;
}