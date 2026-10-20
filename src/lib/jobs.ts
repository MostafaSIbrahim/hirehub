export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "REMOVED"] as const;
export const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
export const EXPERIENCE_LEVELS = ["ENTRY", "MID", "SENIOR", "LEAD"] as const;
export const CURRENCIES = ["USD", "EUR", "EGP", "AED", "SAR"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site",
};
export const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship",
};
export const EXPERIENCE_LEVEL_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  ENTRY: "Entry level", MID: "Mid level", SENIOR: "Senior", LEAD: "Lead",
};