export const APPLICATION_STATUSES = [
  "SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const PIPELINE: ApplicationStatus[] = ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];
const FINAL = new Set<ApplicationStatus>(["HIRED", "REJECTED", "WITHDRAWN"]);

export const isFinal = (status: ApplicationStatus) => FINAL.has(status);

/** Statuses an employer may move an application to from `from`. */
export function employerNextStatuses(from: ApplicationStatus): ApplicationStatus[] {
  if (isFinal(from)) return [];
  const index = PIPELINE.indexOf(from);
  return [...PIPELINE.slice(index + 1), "REJECTED"];
}

export const canEmployerMove = (from: ApplicationStatus, to: ApplicationStatus) =>
  employerNextStatuses(from).includes(to);

export const canWithdraw = (from: ApplicationStatus) => !isFinal(from);

export const formatStatus = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();