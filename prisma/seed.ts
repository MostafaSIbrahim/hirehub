import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/server/db";

// ───────────────────────────── Types & helpers ─────────────────────────────

type Role = "SEEKER" | "EMPLOYER" | "ADMIN";
type Level = "ENTRY" | "MID" | "SENIOR" | "LEAD";
type AppStatus =
  | "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW"
  | "OFFERED" | "HIRED" | "REJECTED" | "WITHDRAWN";

const PASSWORD = "Password123!";
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ───────────────────────────── Demo data ─────────────────────────────

const COMPANIES = [
  {
    name: "Nilewave Tech",
    location: "Cairo, Egypt",
    size: "51-200",
    website: "https://nilewave.example.com",
    description: "We build cloud software for logistics companies across the Middle East.",
  },
  {
    name: "Pyramid Labs",
    location: "Alexandria, Egypt",
    size: "11-50",
    website: "https://pyramidlabs.example.com",
    description: "A product studio shipping web and mobile apps for startups.",
  },
  {
    name: "Lotus Fintech",
    location: "Dubai, UAE",
    size: "201-500",
    website: "https://lotusfintech.example.com",
    description: "Digital payments and banking infrastructure for the region.",
  },
];

const ROLES: { title: string; skills: string[]; level: Level }[] = [
  { title: "Senior React Developer", skills: ["React", "TypeScript", "Next.js"], level: "SENIOR" },
  { title: "Backend Engineer (Node.js)", skills: ["Node.js", "PostgreSQL", "TypeScript"], level: "MID" },
  { title: "Junior Frontend Developer", skills: ["HTML", "CSS", "JavaScript", "React"], level: "ENTRY" },
  { title: "DevOps Engineer", skills: ["Docker", "Kubernetes", "AWS"], level: "MID" },
  { title: "Data Analyst", skills: ["SQL", "Python", "Power BI"], level: "ENTRY" },
  { title: "Product Designer", skills: ["Figma", "UX Research", "Prototyping"], level: "MID" },
  { title: "Engineering Lead", skills: ["Leadership", "System Design", "TypeScript"], level: "LEAD" },
  { title: "QA Automation Engineer", skills: ["Playwright", "TypeScript", "CI/CD"], level: "MID" },
  { title: "Mobile Developer (React Native)", skills: ["React Native", "TypeScript", "iOS"], level: "SENIOR" },
  { title: "Machine Learning Engineer", skills: ["Python", "PyTorch", "MLOps"], level: "SENIOR" },
];

const SALARY: Record<Level, [number, number]> = {
  ENTRY: [800, 1500],
  MID: [1500, 3000],
  SENIOR: [3000, 5000],
  LEAD: [4500, 7000],
};

const SEEKERS: { name: string; headline: string; skills: string[]; years: number; bio?: string }[] = [
  { name: "Omar Hassan", headline: "Frontend Developer", skills: ["React", "TypeScript", "CSS"], years: 3, bio: "I love building fast, accessible UIs." },
  { name: "Salma Adel", headline: "Full-stack Developer", skills: ["Node.js", "React", "PostgreSQL"], years: 5, bio: "Shipping end-to-end features for 5 years." },
  { name: "Youssef Nabil", headline: "Junior Web Developer", skills: ["HTML", "CSS", "JavaScript"], years: 0 },
  { name: "Mariam Fathy", headline: "Data Analyst", skills: ["SQL", "Python", "Power BI"], years: 2, bio: "Turning messy data into decisions." },
  { name: "Karim Mostafa", headline: "DevOps Engineer", skills: ["Docker", "AWS", "Kubernetes"], years: 4 },
  { name: "Nour El-Din", headline: "Product Designer", skills: ["Figma", "Prototyping", "UX Research"], years: 3, bio: "Designing products people enjoy using." },
  { name: "Hana Samir", headline: "QA Engineer", skills: ["Playwright", "TypeScript"], years: 2 },
  { name: "Ahmed Tarek", headline: "Mobile Developer", skills: ["React Native", "TypeScript", "iOS"], years: 4, bio: "Cross-platform apps with native feel." },
  { name: "Laila Gamal", headline: "ML Engineer", skills: ["Python", "PyTorch", "MLOps"], years: 3 },
  { name: "Ziad Ashraf", headline: "Tech Lead", skills: ["System Design", "TypeScript", "Leadership"], years: 9, bio: "Growing teams and architectures." },
];

// The path an application takes to reach each status (powers the timeline)
const PIPELINE: AppStatus[] = ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];
function pathTo(status: AppStatus): AppStatus[] {
  if (status === "REJECTED") return ["SUBMITTED", "REVIEWING", "REJECTED"];
  if (status === "WITHDRAWN") return ["SUBMITTED", "WITHDRAWN"];
  return PIPELINE.slice(0, PIPELINE.indexOf(status) + 1);
}
const APP_STATUSES: AppStatus[] = [
  "SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED",
  "HIRED", "REJECTED", "WITHDRAWN", "SUBMITTED", "REVIEWING",
];

// ───────────────────────────── Steps ─────────────────────────────

async function clearDatabase() {
  // Children first, parents last — otherwise foreign keys block the deletes.
  await prisma.applicationEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.seekerProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(name: string, email: string, role: Role) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name,
      email,
      role,
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(PASSWORD), // same hashing Better Auth uses at sign-up
        },
      },
    },
  });
  return id;
}

async function main() {
  console.log("🧹 Clearing database…");
  await clearDatabase();

  console.log("👤 Creating users…");
  await createUser("HireHub Admin", "admin@hirehub.dev", "ADMIN");

  const companies: { id: string; ownerId: string; name: string; location: string }[] = [];
  for (const [i, c] of COMPANIES.entries()) {
    const ownerId = await createUser(`${c.name} Recruiter`, `employer${i + 1}@hirehub.dev`, "EMPLOYER");
    const company = await prisma.company.create({
      data: { ...c, ownerId, slug: slugify(c.name), verified: i !== 2 }, // one unverified, for admin moderation
    });
    companies.push({ id: company.id, ownerId, name: c.name, location: c.location });
  }

  const seekerIds: string[] = [];
  for (const [i, s] of SEEKERS.entries()) {
    const id = await createUser(s.name, `seeker${i + 1}@hirehub.dev`, "SEEKER");
    await prisma.seekerProfile.create({
      data: {
        userId: id,
        headline: s.headline,
        bio: s.bio,
        location: i % 3 === 0 ? "Cairo, Egypt" : i % 3 === 1 ? "Giza, Egypt" : "Remote",
        skills: s.skills,
        experienceYears: s.years,
        resumeUrl: s.bio ? "/uploads/demo-resume.pdf" : null, // some profiles incomplete on purpose
      },
    });
    seekerIds.push(id);
  }

  console.log("💼 Creating jobs…");
  const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;
  const EMPLOYMENT = ["FULL_TIME", "FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;

  const jobs: { id: string; status: string; ownerId: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const company = companies[i % companies.length];
    const role = ROLES[i % ROLES.length];
    const workMode = WORK_MODES[Math.floor(i / 3) % 3];
    const status = i % 11 === 4 ? "DRAFT" : i % 11 === 9 ? "CLOSED" : "PUBLISHED";
    const [salaryMin, salaryMax] = SALARY[role.level];

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: role.title,
        slug: `${slugify(role.title)}-${slugify(company.name)}-${i + 1}`,
        description:
          `${company.name} is hiring a ${role.title}.\n\n` +
          `You will work with ${role.skills.join(", ")} in a collaborative team, ` +
          `own features end to end, and help shape how we build.\n\n` +
          `Requirements: solid experience with ${role.skills[0]}, good communication, and curiosity.`,
        location: workMode === "REMOTE" ? "Remote" : company.location,
        workMode,
        employmentType: EMPLOYMENT[i % EMPLOYMENT.length],
        experienceLevel: role.level,
        salaryMin,
        salaryMax,
        skills: role.skills,
        status,
        publishedAt: status === "DRAFT" ? null : daysAgo(i % 28), // spread over 4 weeks for "posted within" filter
        expiresAt: status === "CLOSED" ? daysAgo(1) : null,
      },
    });
    jobs.push({ id: job.id, status, ownerId: company.ownerId });
  }

  console.log("📨 Creating applications…");
  const applicable = jobs.filter((j) => j.status !== "DRAFT"); // nobody can apply to a draft
  for (let k = 0; k < 25; k++) {
    const seekerId = seekerIds[k % seekerIds.length];
    const job = applicable[(k * 7) % applicable.length]; // 7 and 27 share no factors → no duplicate pairs
    const status = APP_STATUSES[k % APP_STATUSES.length];
    const path = pathTo(status);
    const submittedAt = daysAgo(20 - (k % 15));

    await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId,
        resumeUrl: "/uploads/demo-resume.pdf",
        coverLetter: k % 2 === 0 ? "I'm excited about this role and believe my skills are a strong match." : null,
        status,
        createdAt: submittedAt,
        events: {
          create: path.map((to, i) => ({
            fromStatus: i === 0 ? null : path[i - 1],
            toStatus: to,
            // the seeker submits/withdraws; the employer moves everything else
            actorId: to === "SUBMITTED" || to === "WITHDRAWN" ? seekerId : job.ownerId,
            createdAt: addDays(submittedAt, i),
          })),
        },
      },
    });
  }

  console.log("🔖 Creating saved jobs…");
  const published = jobs.filter((j) => j.status === "PUBLISHED");
  await prisma.savedJob.createMany({
    data: seekerIds.flatMap((userId, s) => [
      { userId, jobId: published[(s * 3) % published.length].id },
      { userId, jobId: published[(s * 3 + 1) % published.length].id },
    ]),
    skipDuplicates: true,
  });

  const [users, jobCount, apps] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);
  console.log(`✅ Done: ${users} users, ${jobCount} jobs, ${apps} applications. Password for all: ${PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });