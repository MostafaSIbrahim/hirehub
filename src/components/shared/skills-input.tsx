"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function SkillsInput({
  id, value, onChange, max = 15,
}: { id?: string; value: string[]; onChange: (next: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const skill = raw.trim().replace(/,$/, "");
    setDraft("");
    if (!skill || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === skill.toLowerCase())) return; // no duplicates
    onChange([...value, skill]);
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      {value.map((skill) => (
        <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
          {skill}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== skill))} aria-label={`Remove ${skill}`} className="rounded hover:text-destructive">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault(); // Enter must NOT submit the whole form
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Type a skill, press Enter"}
        className="min-w-28 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  );
}