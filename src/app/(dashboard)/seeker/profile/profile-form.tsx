"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { seekerProfileSchema, type SeekerProfileInput } from "@/lib/validators/profile";
import { updateSeekerProfileAction } from "@/server/actions/profile";

export function ProfileForm({ defaults }: { defaults: SeekerProfileInput }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SeekerProfileInput>({ resolver: zodResolver(seekerProfileSchema), defaultValues: defaults });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateSeekerProfileAction(values);
      if ("error" in result) return void toast.error(result.error);
      toast.success("Profile saved");
      form.reset(values); // the saved values become the new "clean" state
    }),
  );

  return (
    <Card>
      <CardHeader><CardTitle>About you</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" placeholder="Frontend developer · React & TypeScript" {...form.register("headline")} />
            {errors.headline && <p className="text-sm text-destructive">{errors.headline.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Cairo, Egypt" {...form.register("location")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of experience</Label>
              <Input id="experienceYears" type="number" min={0} max={60} {...form.register("experienceYears", { valueAsNumber: true })} />
              {errors.experienceYears && <p className="text-sm text-destructive">{errors.experienceYears.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input id="skills" placeholder="React, TypeScript, Node.js" aria-describedby="skills-hint" {...form.register("skills")} />
            <p id="skills-hint" className="text-xs text-muted-foreground">Separate with commas. We use these to recommend jobs.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={5} {...form.register("bio")} />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          </div>
          <Button type="submit" disabled={pending || !isDirty}>{pending ? "Saving…" : "Save profile"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}