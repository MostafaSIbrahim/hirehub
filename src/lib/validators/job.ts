import { z } from "zod";
import { CURRENCIES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from "@/lib/jobs";

const salary = z.number({ error: "Enter a number" }).int().min(0).max(10_000_000).optional();

export const jobSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    location: z.string().trim().min(2, "Where is this job?").max(100),
    workMode: z.enum(WORK_MODES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    description: z.string().trim().min(30, "Describe the role in at least 30 characters").max(10_000),
    skills: z.array(z.string().trim().min(1).max(40)).max(15, "Up to 15 skills"),
    salaryMin: salary,
    salaryMax: salary,
    currency: z.enum(CURRENCIES),
  })
  // A rule that involves TWO fields → .refine on the whole object, error attached to one field
  .refine((d) => d.salaryMin == null || d.salaryMax == null || d.salaryMin <= d.salaryMax, {
    message: "Max must be greater than or equal to min",
    path: ["salaryMax"],
  });

export type JobInput = z.infer<typeof jobSchema>;