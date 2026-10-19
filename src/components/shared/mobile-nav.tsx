"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardNav } from "./dashboard-nav";

export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetHeader className="px-2">
          <SheetTitle className="text-primary">HireHub</SheetTitle>
        </SheetHeader>
        {/* close the drawer after a link is tapped */}
        <DashboardNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}