import { z } from "zod";
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from "@/lib/jobs";

// .catch(undefined): a bad value in the URL (?mode=banana) is IGNORED, not a crash.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);
const optionalText = z.string().trim().max(100).transform((v) => v || undefined).optional().catch(undefined);
const optionalInt = (max: number) =>
  z.coerce.number().int().min(1).max(max).optional().catch(undefined);

export const jobSearchSchema = z.object({
  q: optionalText,
  mode: optionalEnum(WORK_MODES),
  type: optionalEnum(EMPLOYMENT_TYPES),
  level: optionalEnum(EXPERIENCE_LEVELS),
  location: optionalText,
  minSalary: optionalInt(10_000_000),
  posted: z.enum(["1", "7", "30"]).optional().catch(undefined),
  sort: z.enum(["relevance", "newest", "salary"]).optional().catch(undefined),
  page: optionalInt(1000),
});
export type JobSearch = z.infer<typeof jobSearchSchema>;

type RawParams = Record<string, string | string[] | undefined>;

export function parseJobSearch(raw: RawParams): JobSearch {
  // ?mode=REMOTE&mode=HYBRID gives an array; we take the first value
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return jobSearchSchema.parse(flat);
}

/** Apply changes to the current filters → a /jobs URL. Any filter change resets to page 1. */
export function buildJobsHref(current: JobSearch, changes: Partial<Record<keyof JobSearch, string | number | undefined>>) {
  const next: Record<string, unknown> = { ...current, ...changes };
  if (!("page" in changes)) delete next.page;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export const hasActiveFilters = (f: JobSearch) =>
  Boolean(f.mode || f.type || f.level || f.location || f.minSalary || f.posted);