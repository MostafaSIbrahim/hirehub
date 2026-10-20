"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildJobsHref, type JobSearch } from "@/lib/job-search";

export function useJobsNavigation(filters: JobSearch) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(changes: Parameters<typeof buildJobsHref>[1], opts: { replace?: boolean } = {}) {
    const href = buildJobsHref(filters, changes);
    // A transition keeps the CURRENT results on screen until the new ones are ready:
    // no flash of the loading skeleton on every keystroke or filter change.
    startTransition(() => {
      if (opts.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }
  return { update, isPending };
}