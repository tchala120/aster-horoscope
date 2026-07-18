"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LessonSummary, LessonType } from "@/shared";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { LessonCard } from "./components/LessonCard";
import { schoolApi } from "./state/school-api";

const LIMIT = 12;

type Group = "reading" | "video";

const GROUP_TYPES: Record<Group, LessonType[]> = {
  reading: ["article", "pdf"],
  video: ["video"],
};

interface Filters {
  q: string;
  tag: string;
  group: Group;
}

/**
 * Aster School feed: a public, paginated grid of lessons with title search and
 * tag filtering. Logged-in users can add a new lesson. All state changes fetch
 * via the API; loading is set in event handlers so the effect never sets state
 * synchronously.
 */
export function SchoolFeed() {
  const [qInput, setQInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [applied, setApplied] = useState<Filters>({ q: "", tag: "", group: "reading" });

  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runFetch = useCallback((pageToLoad: number, filters: Filters, replace: boolean) => {
    return schoolApi
      .list({
        page: pageToLoad,
        limit: LIMIT,
        q: filters.q || undefined,
        tag: filters.tag || undefined,
        types: GROUP_TYPES[filters.group],
      })
      .then((res) => {
        if (res.ok) {
          setError(null);
          setTotal(res.value.total);
          setPage(res.value.page);
          setLessons((prev) => (replace ? res.value.lessons : [...prev, ...res.value.lessons]));
        } else {
          setError(res.error.message);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void runFetch(1, applied, true);
  }, [applied, runFetch]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApplied((prev) => ({ ...prev, q: qInput.trim(), tag: tagInput.trim().toLowerCase() }));
  };

  const onTabChange = (group: Group) => {
    if (group === applied.group) return;
    setLoading(true);
    setApplied((prev) => ({ ...prev, group }));
  };

  const loadMore = () => {
    setLoading(true);
    void runFetch(page + 1, applied, false);
  };

  const hasMore = lessons.length < total;

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <BackLink />

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              Aster School
            </p>
            <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Knowledge base</h1>
            <p className="mt-1 text-text-md text-grey-400">
              Read guides and documents, or share what you know.
            </p>
          </div>
          <Link
            href="/school/new"
            className="shrink-0 rounded-full bg-brand-gradient px-5 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            + New lesson
          </Link>
        </header>

        <div className="inline-flex w-fit gap-1 rounded-full bg-grey-900/50 p-1 ring-1 ring-white/8">
          {(["reading", "video"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onTabChange(g)}
              aria-pressed={applied.group === g}
              className={`rounded-full px-4 py-1.5 text-text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
                applied.group === g ? "bg-white/10 text-grey-50" : "text-grey-400 hover:text-grey-200"
              }`}
            >
              {g === "reading" ? "Reading" : "Video"}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="flex flex-wrap gap-2">
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search titles…"
            aria-label="Search lessons by title"
            className="min-w-0 flex-1 rounded-full bg-grey-900/60 px-4 py-2.5 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          />
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tag…"
            aria-label="Filter by tag"
            className="w-32 rounded-full bg-grey-900/60 px-4 py-2.5 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          />
          <button
            type="submit"
            className="rounded-full bg-white/8 px-5 py-2.5 text-text-md font-semibold text-grey-100 ring-1 ring-white/12 transition-colors hover:bg-white/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          >
            Search
          </button>
        </form>

        {error ? <p className="text-text-md text-red-400">{error}</p> : null}

        {lessons.length === 0 && !loading ? (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">
              {applied.q || applied.tag ? "No lessons match your search." : "No lessons yet."}
            </p>
            <p className="mt-1 text-text-md text-grey-400">Be the first to share something.</p>
            <Link
              href="/school/new"
              className="mt-5 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Write a lesson
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/8 rounded-xl bg-grey-900/30 ring-1 ring-white/8">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}

        {loading ? <p className="text-center text-grey-400">Loading…</p> : null}

        {hasMore && !loading ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              className="rounded-full px-6 py-2.5 text-text-md font-semibold text-grey-200 ring-1 ring-white/15 transition-colors hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
            >
              Load more
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
