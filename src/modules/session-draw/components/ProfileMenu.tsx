"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ProfileMenuProps {
  /** Logged-in player's display name. */
  username: string;
  onLogout: () => void;
}

/**
 * Top-right account chip: shows the signed-in player's avatar initial + name,
 * and opens a small menu with "Log out". Presentational — the parent owns auth.
 * Closes on outside click or Escape.
 */
export function ProfileMenu({ username, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = username.trim().charAt(0).toUpperCase() || "?";

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
    <div ref={ref} className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${username}`}
        className="flex items-center gap-2 rounded-full bg-grey-900/70 py-1.5 pl-1.5 pr-3 ring-1 ring-white/8 backdrop-blur transition-colors hover:bg-grey-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-text-sm font-bold text-grey-950"
        >
          {initial}
        </span>
        <span className="max-w-[8rem] truncate text-text-sm font-semibold text-grey-100">
          {username}
        </span>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          className={`text-grey-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-grey-gradient p-2 shadow-2xl ring-1 ring-white/8"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-text-md font-bold text-grey-950"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-text-sm font-semibold text-grey-50">{username}</p>
              <p className="text-text-sm text-grey-400">Signed in</p>
            </div>
          </div>

          <div className="my-1 h-px bg-white/8" />

          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8 focus:outline-none focus-visible:bg-white/8"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              className="text-grey-400"
            >
              <path
                d="M4 7.5 10 4l6 3.5v5L10 16l-6-3.5v-5Z M10 4v12 M4 7.5 10 11l6-3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Games hub
          </Link>

          <Link
            href="/history"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8 focus:outline-none focus-visible:bg-white/8"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              className="text-grey-400"
            >
              <path
                d="M10 5.5V10l3 2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View history
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8 focus:outline-none focus-visible:bg-white/8"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              className="text-grey-400"
            >
              <path
                d="M12.5 14v1.5A1.5 1.5 0 0 1 11 17H5.5A1.5 1.5 0 0 1 4 15.5v-11A1.5 1.5 0 0 1 5.5 3H11a1.5 1.5 0 0 1 1.5 1.5V6M8.5 10h8m0 0-2.5-2.5M16.5 10 14 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
