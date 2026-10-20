"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NativeSelect } from "@/components/shared/native-select";
import { hasActiveFilters, type JobSearch } from "@/lib/job-search";
import {
  EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS, WORK_MODES, WORK_MODE_LABELS,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { useJobsNavigation } from "./use-jobs-navigation";

export function JobFilters({ filters }: { filters: JobSearch }) {
  const { update } = useJobsNavigation(filters);

  // Uncontrolled (defaultValue) + key: the field shows the user's choice INSTANTLY,
  // and resets to the URL value whenever the URL changes (e.g. "Clear all").
  const select = (name: "mode" | "type" | "level" | "posted", label: string, options: [string, string][]) => (
    <div className="space-y-2">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <NativeSelect id={`f-${name}`} key={filters[name] ?? ""} defaultValue={filters[name] ?? ""}
        onChange={(e) => update({ [name]: e.target.value || undefined })}>
        <option value="">Any</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </NativeSelect>
    </div>
  );

  const applyOnEnterOrBlur = (name: "location" | "minSalary") => ({
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value !== String(filters[name] ?? "")) update({ [name]: e.target.value.trim() || undefined });
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); },
  });

  return (
    <div className="space-y-5">
      {select("mode", "Work mode", WORK_MODES.map((v) => [v, WORK_MODE_LABELS[v]]))}
      {select("type", "Employment type", EMPLOYMENT_TYPES.map((v) => [v, EMPLOYMENT_TYPE_LABELS[v]]))}
      {select("level", "Experience level", EXPERIENCE_LEVELS.map((v) => [v, EXPERIENCE_LEVEL_LABELS[v]]))}
      {select("posted", "Posted within", [["1", "Last 24 hours"], ["7", "Last 7 days"], ["30", "Last 30 days"]])}

      <div className="space-y-2">
        <Label htmlFor="f-location">Location</Label>
        <Input id="f-location" key={filters.location ?? ""} defaultValue={filters.location ?? ""} placeholder="City or country" {...applyOnEnterOrBlur("location")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-minSalary">Min salary / month</Label>
        <Input id="f-minSalary" type="number" min={0} key={filters.minSalary ?? ""} defaultValue={filters.minSalary ?? ""} placeholder="e.g. 2000" {...applyOnEnterOrBlur("minSalary")} />
      </div>

      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" className="w-full"
          onClick={() => update({ mode: undefined, type: undefined, level: undefined, location: undefined, minSalary: undefined, posted: undefined })}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export function MobileFilters({ filters }: { filters: JobSearch }) {
  return (
    <Sheet>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "md:hidden")}>
        <SlidersHorizontal className="size-4" aria-hidden /> Filters{hasActiveFilters(filters) ? " •" : ""}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto p-4">
        <SheetHeader className="px-0"><SheetTitle>Filters</SheetTitle></SheetHeader>
        <JobFilters filters={filters} />
      </SheetContent>
    </Sheet>
  );
}

export function SortSelect({ filters, hasQuery }: { filters: JobSearch; hasQuery: boolean }) {
  const { update } = useJobsNavigation(filters);
  const current = filters.sort ?? (hasQuery ? "relevance" : "newest");
  return (
    <NativeSelect aria-label="Sort jobs" className="h-8 w-auto" key={current} defaultValue={current}
      onChange={(e) => update({ sort: e.target.value })}>
      {hasQuery && <option value="relevance">Most relevant</option>}
      <option value="newest">Newest</option>
      <option value="salary">Highest salary</option>
    </NativeSelect>
  );
}