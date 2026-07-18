"use client";

import { useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

/** Pill-style tag editor: type + Enter (or comma) to add, × to remove. */
export function TagInput({ tags, onChange, max = 5 }: TagInputProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const t = input.trim().toLowerCase();
    setInput("");
    if (!t || tags.includes(t) || tags.length >= max) return;
    onChange([...tags, t]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-grey-900/60 px-3 py-2 ring-1 ring-white/10">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-0.5 text-text-sm text-grey-200"
        >
          #{t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            aria-label={`Remove tag ${t}`}
            className="text-grey-500 hover:text-grey-100"
          >
            ×
          </button>
        </span>
      ))}
      {tags.length < max ? (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={tags.length ? "" : "Add up to 5 tags…"}
          className="min-w-[7rem] flex-1 bg-transparent text-text-md text-grey-100 placeholder:text-grey-500 focus:outline-none"
        />
      ) : null}
    </div>
  );
}
