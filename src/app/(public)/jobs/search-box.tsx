"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { JobSearch } from "@/lib/job-search";
import { useJobsNavigation } from "./use-jobs-navigation";

export function SearchBox({ filters }: { filters: JobSearch }) {
  const { update, isPending } = useJobsNavigation(filters);
  const [text, setText] = useState(filters.q ?? "");

  // Debounce: search 400 ms after the user STOPS typing, not on every key.
  useEffect(() => {
    const q = text.trim();
    if (isPending || q === (filters.q ?? "")) return;
    const timer = setTimeout(() => update({ q: q || undefined, sort: undefined }, { replace: true }), 400);
    return () => clearTimeout(timer); // typing again cancels the previous timer
  }, [text, filters.q, isPending, update]);

  return (
    <form role="search" className="relative" onSubmit={(e) => { e.preventDefault(); update({ q: text.trim() || undefined, sort: undefined }); }}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label="Search jobs"
        placeholder='Try "react", "remote designer" or "python -django"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-11 pl-9 pr-9"
      />
      {isPending && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Searching" />}
    </form>
  );
}