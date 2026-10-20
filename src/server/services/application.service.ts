import "server-only";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { sendEmail } from "@/server/email";
import { canEmployerMove, canWithdraw, formatStatus, type ApplicationStatus } from "@/lib/application-status";

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";

// ───────────── Seeker ─────────────

export async function applyToJob(seekerId: string, jobId: string, coverLetter: string) {
  const [job, profile, seeker] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, select: { status: true, title: true, company: { select: { owner: { select: { email: true } } } } } }),
    prisma.seekerProfile.findUnique({ where: { userId: seekerId }, select: { resumeUrl: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: seekerId }, select: { name: true, email: true } }),
  ]);
  if (!job || job.status !== "PUBLISHED") throw new AppError("This job is not accepting applications.");
  if (!profile?.resumeUrl) throw new AppError("Upload your CV on your profile first.");

  try {
    await prisma.application.create({
      data: {
        jobId,
        seekerId,
        coverLetter: coverLetter.trim() || null,
        resumeUrl: profile.resumeUrl, // SNAPSHOT: the employer sees the CV you applied with, even if you replace it later
        events: { create: { toStatus: "SUBMITTED", actorId: seekerId } }, // same query → same transaction
      },
    });
  } catch (e) {
    // The @@unique([jobId, seekerId]) constraint is the REAL guard against double-applying,
    // even when two clicks race each other. We just translate its error into a friendly message.
    if (isUniqueViolation(e)) throw new AppError("You've already applied to this job.");
    throw e;
  }

  sendEmail(seeker.email, `Application received: ${job.title}`, "We'll let you know when the employer reviews it.");
  sendEmail(job.company.owner.email, `New applicant for ${job.title}`, `${seeker.name} just applied.`);
}

export function getMyApplicationForJob(seekerId: string, jobId: string) {
  return prisma.application.findUnique({
    where: { jobId_seekerId: { jobId, seekerId } }, // compound unique → direct lookup
    select: { status: true, createdAt: true },
  });
}

export function listMyApplications(seekerId: string) {
  return prisma.application.findMany({
    where: { seekerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, status: true, createdAt: true,
      job: { select: { title: true, slug: true, company: { select: { name: true } } } },
      // NO `note`: employer notes are internal. The seeker sees status changes only.
      events: { orderBy: { createdAt: "asc" }, select: { id: true, toStatus: true, createdAt: true } },
    },
  });
}

export async function withdrawApplication(seekerId: string, applicationId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, seekerId }, // ownership: only your own applications
    select: { id: true, status: true },
  });
  if (!app) throw new AppError("Application not found.");
  if (!canWithdraw(app.status)) throw new AppError("This application can no longer be withdrawn.");
  await recordTransition(app.id, app.status, "WITHDRAWN", seekerId, null);
}

// ───────────── Employer ─────────────

export async function listApplicantsForJob(employerId: string, jobId: string, status?: ApplicationStatus) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, company: { ownerId: employerId } },
    select: { id: true, title: true, slug: true },
  });
  if (!job) return null;

  const applicants = await prisma.application.findMany({
    where: { jobId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, status: true, coverLetter: true, resumeUrl: true, createdAt: true,
      seeker: {
        select: {
          name: true, email: true,
          seekerProfile: { select: { headline: true, skills: true, experienceYears: true, location: true } },
        },
      },
      events: { orderBy: { createdAt: "asc" }, select: { id: true, toStatus: true, note: true, createdAt: true } },
    },
  });
  return { job, applicants };
}

export async function moveApplication(employerId: string, applicationId: string, to: ApplicationStatus, note: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, job: { company: { ownerId: employerId } } }, // only applicants to YOUR jobs
    select: { id: true, status: true, job: { select: { title: true } }, seeker: { select: { email: true } } },
  });
  if (!app) throw new AppError("Application not found.");
  if (!canEmployerMove(app.status, to)) {
    throw new AppError(`Can't move from ${formatStatus(app.status)} to ${formatStatus(to)}.`);
  }
  await recordTransition(app.id, app.status, to, employerId, note.trim() || null);
  sendEmail(app.seeker.email, `Update on your application: ${app.job.title}`, `Your application is now: ${formatStatus(to)}.`);
}

// ───────────── Shared ─────────────

/** Status change + history row: both happen, or neither. */
async function recordTransition(
  applicationId: string, from: ApplicationStatus, to: ApplicationStatus, actorId: string, note: string | null,
) {
  await prisma.$transaction(async (tx) => {
    // optimistic concurrency, like M2: only if the status is still what we checked
    const updated = await tx.application.updateMany({ where: { id: applicationId, status: from }, data: { status: to } });
    if (updated.count === 0) throw new AppError("This application was just updated. Refresh and try again.");
    await tx.applicationEvent.create({ data: { applicationId, fromStatus: from, toStatus: to, actorId, note } });
  });
}