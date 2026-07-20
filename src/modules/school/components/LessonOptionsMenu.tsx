"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KebabIcon } from "./icons";
import { schoolApi } from "../state/school-api";

interface LessonOptionsMenuProps {
  lessonId: string;
  onDeleted: (lessonId: string) => void;
}

/**
 * Owner-only "⋮" menu for a lesson card — Edit / Delete without leaving the feed.
 * Closes on outside click or Escape (same pattern as session-draw's ProfileMenu).
 */
export function LessonOptionsMenu({ lessonId, onDeleted }: LessonOptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    setDeleting(true);
    void schoolApi.remove(lessonId).then((res) => {
      if (res.ok) {
        onDeleted(lessonId);
      } else {
        setDeleting(false);
        window.alert(res.error.message);
      }
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lesson options"
        className="flex h-8 w-8 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-white/10 hover:text-grey-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
      >
        <KebabIcon />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Lesson options"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl bg-grey-gradient p-1.5 shadow-2xl ring-1 ring-white/10"
        >
          <Link
            href={`/school/${lessonId}/edit`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8"
          >
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={deleting}
            className="block w-full rounded-lg px-3 py-2 text-left text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8 hover:text-red-400 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
