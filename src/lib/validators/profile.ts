import { z } from "zod";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export const seekerProfileSchema = z.object({
  headline: z.string().trim().max(120, "Keep it under 120 characters"),
  location: z.string().trim().max(100),
  experienceYears: z.number({ error: "Enter a number" }).int().min(0).max(60),
  skills: z.string().max(500), // comma-separated in the form; the service turns it into an array
  bio: z.string().trim().max(2000, "Keep it under 2000 characters"),
});
export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const companySchema = z.object({
  name: z.string().trim().min(2, "Company name is too short").max(100),
  // ONLY http(s). A plain URL check would accept "javascript:alert(1)", and rendering
  // that as <a href> runs the attacker's code when someone clicks it (XSS).
  website: z.union([
    z.literal(""),
    z.url({ protocol: /^https?$/, error: "Enter a full URL, e.g. https://acme.com" }),
  ]),
  location: z.string().trim().max(100),
  size: z.union([z.literal(""), z.enum(COMPANY_SIZES)]),
  description: z.string().trim().max(2000),
});
export type CompanyInput = z.infer<typeof companySchema>;