"use client";

import { useEffect, useRef, useState } from "react";
import { AddToPlaylistPanel } from "./AddToPlaylistPanel";

interface AddToPlaylistMenuProps {
  lessonId: string;
}

/** "Add to playlist" popover trigger: opens the playlist picker for this video. */
export function AddToPlaylistMenu({ lessonId }: AddToPlaylistMenuProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 hover:bg-white/8"
      >
        + Add to playlist
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Add to playlist"
          className="absolute right-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-xl bg-grey-gradient p-2.5 shadow-2xl ring-1 ring-white/10"
        >
          <AddToPlaylistPanel lessonId={lessonId} />
        </div>
      ) : null}
    </div>
  );
}
