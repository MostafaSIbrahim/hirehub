import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { slugify } from "@/lib/slug";
import type { CompanyInput } from "@/lib/validators/profile";

const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());

export function getCompanyForOwner(ownerId: string) {
  return prisma.company.findUnique({ where: { ownerId } });
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "company";
  const taken = await prisma.company.findUnique({ where: { slug: base }, select: { id: true } });
  return taken ? `${base}-${randomUUID().slice(0, 6)}` : base;
}

export async function upsertCompany(ownerId: string, input: CompanyInput) {
  const data = {
    name: input.name,
    website: emptyToNull(input.website),
    location: emptyToNull(input.location),
    size: emptyToNull(input.size),
    description: emptyToNull(input.description),
  };
  const existing = await prisma.company.findUnique({ where: { ownerId }, select: { id: true } });
  if (existing) {
    // The slug stays the same on rename: public URLs must not break.
    return prisma.company.update({ where: { id: existing.id }, data });
  }
  return prisma.company.create({ data: { ...data, ownerId, slug: await uniqueSlug(input.name) } });
}