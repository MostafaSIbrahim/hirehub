import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, CheckCircle2, Search, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/shared/job-card";
import { getLatestJobs, getPlatformStats } from "@/server/services/search.service";
import { cacheLife } from "next/cache";

export const metadata = {
  title: "HireHub · Find your next job or your next hire",
  description: "Search jobs from verified companies, apply in two clicks and track every application. Employers post jobs and hire from one simple pipeline.",
};

const QUICK_LINKS = [
  { label: "Remote", href: "/jobs?mode=REMOTE" },
  { label: "Senior roles", href: "/jobs?level=SENIOR" },
  { label: "Internships", href: "/jobs?type=INTERNSHIP" },
  { label: "React", href: "/jobs?q=react" },
  { label: "Design", href: "/jobs?q=designer" },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-12">
      <Hero />
      <Suspense fallback={<StatsSkeleton />}><PlatformStats /></Suspense>
      <LatestJobsSection />
      <Audiences />
      <footer className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
        <p><span className="font-semibold text-primary">HireHub</span> · Built with Next.js & PostgreSQL</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/jobs" className="hover:text-foreground">Jobs</Link>
          <Link href="/login" className="hover:text-foreground">Log in</Link>
          <Link href="/register" className="hover:text-foreground">Sign up</Link>
        </nav>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:px-12 sm:py-24">
      {/* Soft brand-colored glows: decorative only, hidden from screen readers */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 size-112 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-1/4 size-112 rounded-full bg-highlight/15 blur-3xl" />

      <div className="relative mx-auto max-w-2xl space-y-6">
        <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-highlight" aria-hidden /> Jobs from verified companies, updated daily
        </p>

        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Find work you&apos;ll <span className="text-primary">love</span>.{" "}
          Hire people who&apos;ll <span className="underline decoration-highlight decoration-4 underline-offset-8">stay</span>.
        </h1>

        <p className="text-lg text-muted-foreground text-pretty">
          HireHub connects job seekers and employers with a simple, transparent hiring process,
          from the first search to the signed offer.
        </p>

        {/* Plain GET form: submits to /jobs?q=..., the search page we already built. No JavaScript needed. */}
        <form action="/jobs" role="search" className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input name="q" aria-label="Search jobs" placeholder="Job title, skill or keyword" className="h-12 bg-background pl-10" />
          </div>
          <Button type="submit" size="lg" className="h-12 px-6">Search jobs</Button>
        </form>

        <nav aria-label="Popular searches" className="flex flex-wrap justify-center gap-2">
          {QUICK_LINKS.map((q) => (
            <Link key={q.href} href={q.href}
              className="rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              {q.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

async function PlatformStats() {
  const s = await getPlatformStats();
  const stats = [
    { label: "Open positions", value: s.jobs, icon: Briefcase },
    { label: "Hiring companies", value: s.companies, icon: Building2 },
    { label: "Active candidates", value: s.seekers, icon: Users },
    { label: "People hired", value: s.hires, icon: Trophy },
  ];
  return (
    <section aria-label="HireHub in numbers">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          // flex-col-reverse: <dt> (label) comes first in the HTML for screen readers, but the number shows on top
          <div key={label} className="flex flex-col-reverse items-center gap-1 rounded-2xl border bg-card p-6 text-center">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-3xl font-semibold tabular-nums">{value.toLocaleString("en")}</dd>
            <Icon className="mb-2 size-5 text-primary" aria-hidden />
          </div>
        ))}
      </dl>
    </section>
  );
}

function LatestJobsSection() {
  return (
    <section aria-labelledby="latest-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="latest-heading" className="text-2xl font-semibold tracking-tight">Latest openings</h2>
          <p className="text-muted-foreground">Fresh roles from companies hiring right now.</p>
        </div>
        <Link href="/jobs" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          View all jobs <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>}>
        <LatestJobs />
      </Suspense>
    </section>
  );
}

async function LatestJobs() {
  "use cache";
  cacheLife("minutes"); // "posted 2 days ago" is recomputed whenever this refreshes
  const jobs = await getLatestJobs();
  if (jobs.length === 0) return <p className="text-muted-foreground">New jobs are on their way. Check back soon.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => <li key={job.id}><JobCard job={job} /></li>)}
    </ul>
  );
}

function Audiences() {
  const paths = [
    {
      title: "For job seekers",
      icon: Search,
      points: ["Search by skill, location, salary and work mode", "Apply in two clicks with the CV on your profile", "Follow every application from submitted to offer"],
      primary: { label: "Create a free account", href: "/register" },
      secondary: { label: "Browse jobs", href: "/jobs" },
    },
    {
      title: "For employers",
      icon: Building2,
      points: ["Post a job in minutes, as a draft or live", "Review every applicant and CV in one place", "Move candidates from review to hire, with full history"],
      primary: { label: "Start hiring", href: "/register" },
      secondary: { label: "Employer log in", href: "/login" },
    },
  ];
  return (
    <section aria-labelledby="audiences-heading" className="space-y-6">
      <h2 id="audiences-heading" className="text-center text-2xl font-semibold tracking-tight">One platform, both sides of hiring</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {paths.map(({ title, icon: Icon, points, primary, secondary }) => (
          <Card key={title} className="rounded-2xl">
            <CardContent className="space-y-5 p-8">
              <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-6" aria-hidden /></div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <ul className="space-y-3">
                {points.map((p) => (
                  <li key={p} className="flex gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild><Link href={primary.href}>{primary.label}</Link></Button>
                <Button asChild variant="outline"><Link href={secondary.href}>{secondary.label}</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
}