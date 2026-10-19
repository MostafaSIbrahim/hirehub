"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY_SIZES, companySchema, type CompanyInput } from "@/lib/validators/profile";
import { saveCompanyAction } from "@/server/actions/profile";

export function CompanyForm({ defaults, isNew }: { defaults: CompanyInput; isNew: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: defaults,
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveCompanyAction(values);
      if ("error" in result) return void toast.error(result.error);

      if (isNew) {
        toast.success("Company created. You can post jobs now.");
        router.push("/employer"); // first-time setup → back to the dashboard, which now shows stats
      } else {
        toast.success("Company saved");
        form.reset(values); // saved values become the new clean state, so Save disables again
        router.refresh();   // re-render server components (dashboard title uses the company name)
      }
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "Company details" : "Edit company"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input
              id="name"
              autoComplete="organization"
              aria-invalid={!!errors.name}
              {...form.register("name")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                inputMode="url"
                placeholder="https://"
                aria-invalid={!!errors.website}
                {...form.register("website")}
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Cairo, Egypt" {...form.register("location")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Company size</Label>
            <select
              id="size"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              {...form.register("size")}
            >
              <option value="">Select size</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} employees
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">About the company</Label>
            <Textarea
              id="description"
              rows={6}
              placeholder="What you do, your culture, why people love working with you."
              aria-invalid={!!errors.description}
              {...form.register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <Button type="submit" disabled={pending || (!isNew && !isDirty)}>
            {pending ? "Saving…" : isNew ? "Create company" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}