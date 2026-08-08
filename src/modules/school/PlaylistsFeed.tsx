"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlaylistSummary } from "@/shared";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { PlaylistCard } from "./components/PlaylistCard";
import { schoolApi } from "./state/school-api";

const LIMIT = 12;

/** Aster School playlists: a public, paginated grid of curated video playlists. */
export function PlaylistsFeed() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runFetch = (pageToLoad: number, replace: boolean) => {
    return schoolApi.playlists.list({ page: pageToLoad, limit: LIMIT }).then((res) => {
      if (res.ok) {
        setError(null);
        setTotal(res.value.total);
        setPage(res.value.page);
        setPlaylists((prev) => (replace ? res.value.playlists : [...prev, ...res.value.playlists]));
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    void runFetch(1, true);
  }, []);

  const loadMore = () => {
    setLoading(true);
    void runFetch(page + 1, false);
  };

  const hasMore = playlists.length < total;

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <BackLink href="/school" />

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              Aster School
            </p>
            <h1 className="mt-1 text-heading-lg font-bold text-grey-50">Playlists</h1>
            <p className="mt-1 text-text-md text-grey-400">Curated video series, in order.</p>
          </div>
          <Link
            href="/school/playlists/new"
            className="shrink-0 rounded-full bg-brand-gradient px-5 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            + New playlist
          </Link>
        </header>

        {error ? <p className="text-text-md text-red-400">{error}</p> : null}

        {playlists.length === 0 && !loading ? (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">No playlists yet.</p>
            <p className="mt-1 text-text-md text-grey-400">
              Group videos into a series for others to watch.
            </p>
            <Link
              href="/school/playlists/new"
              className="mt-5 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Create a playlist
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
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
