"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/native-select";
import { SkillsInput } from "@/components/shared/skills-input";
import {
  CURRENCIES, EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS, WORK_MODES, WORK_MODE_LABELS,
} from "@/lib/jobs";
import { jobSchema, type JobInput } from "@/lib/validators/job";
import { createJobAction, updateJobAction } from "@/server/actions/jobs";

// "" from an empty number input → undefined (= "not set"), otherwise a real number
const toOptionalNumber = (v: unknown) => (v === "" || v == null ? undefined : Number(v));

type Props = { mode: "create" } | { mode: "edit"; jobId: string };

export function JobForm({ defaults, ...props }: Props & { defaults: JobInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<JobInput>({ resolver: zodResolver(jobSchema), defaultValues: defaults });
  const { errors } = form.formState;

  const submit = (publish: boolean) =>
    form.handleSubmit((values) =>
      startTransition(async () => {
        const result =
          props.mode === "create" ? await createJobAction(values, publish) : await updateJobAction(props.jobId, values);
        if ("error" in result) return void toast.error(result.error);
        toast.success(props.mode === "edit" ? "Job updated" : publish ? "Job published" : "Draft saved");
        router.push("/employer/jobs");
      }),
    );

  const err = (msg?: string) => msg && <p className="text-sm text-destructive">{msg}</p>;

  return (
    <form onSubmit={submit(false)} className="space-y-6" noValidate>
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle><CardDescription>What and where.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job title</Label>
            <Input id="title" placeholder="Senior React Developer" aria-invalid={!!errors.title} {...form.register("title")} />
            {err(errors.title?.message)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Cairo, Egypt" aria-invalid={!!errors.location} {...form.register("location")} />
            {err(errors.location?.message)}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="workMode">Work mode</Label>
              <NativeSelect id="workMode" {...form.register("workMode")}>
                {WORK_MODES.map((v) => <option key={v} value={v}>{WORK_MODE_LABELS[v]}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment type</Label>
              <NativeSelect id="employmentType" {...form.register("employmentType")}>
                {EMPLOYMENT_TYPES.map((v) => <option key={v} value={v}>{EMPLOYMENT_TYPE_LABELS[v]}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience level</Label>
              <NativeSelect id="experienceLevel" {...form.register("experienceLevel")}>
                {EXPERIENCE_LEVELS.map((v) => <option key={v} value={v}>{EXPERIENCE_LEVEL_LABELS[v]}</option>)}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle><CardDescription>What the job involves and the skills it needs.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={10} aria-invalid={!!errors.description} {...form.register("description")} />
            {err(errors.description?.message)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            {/* SkillsInput isn't a native input, so we connect it with a Controller */}
            <Controller
              control={form.control}
              name="skills"
              render={({ field }) => <SkillsInput id="skills" value={field.value} onChange={field.onChange} />}
            />
            {err(errors.skills?.message)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Salary</CardTitle><CardDescription>Monthly, optional. Jobs with a salary get more applicants.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="salaryMin">Minimum</Label>
            <Input id="salaryMin" type="number" min={0} {...form.register("salaryMin", { setValueAs: toOptionalNumber })} />
            {err(errors.salaryMin?.message)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryMax">Maximum</Label>
            <Input id="salaryMax" type="number" min={0} aria-invalid={!!errors.salaryMax} {...form.register("salaryMax", { setValueAs: toOptionalNumber })} />
            {err(errors.salaryMax?.message)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <NativeSelect id="currency" {...form.register("currency")}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        {props.mode === "create" ? (
          <>
            <Button type="button" variant="outline" disabled={pending} onClick={submit(false)}>Save as draft</Button>
            <Button type="button" disabled={pending} onClick={submit(true)}>{pending ? "Saving…" : "Publish job"}</Button>
          </>
        ) : (
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        )}
      </div>
    </form>
  );
}