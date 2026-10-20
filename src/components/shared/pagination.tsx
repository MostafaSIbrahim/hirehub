import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Button asChild variant="outline" size="sm"><Link href={hrefFor(page - 1)}>Previous</Link></Button>
                  : <Button variant="outline" size="sm" disabled>Previous</Button>}
        {page < totalPages ? <Button asChild variant="outline" size="sm"><Link href={hrefFor(page + 1)}>Next</Link></Button>
                           : <Button variant="outline" size="sm" disabled>Next</Button>}
      </div>
    </nav>
  );
}