"use client";

import { useEffect, useState } from "react";
import type { PlaylistSummary } from "@/shared";
import { schoolApi } from "../state/school-api";

interface AddToPlaylistPanelProps {
  lessonId: string;
}

/**
 * Content-only "add this video to one of your playlists" panel: pick an
 * existing playlist, or create a new one. Loads on mount — the caller owns
 * the popover chrome (trigger button, outside-click, positioning).
 */
export function AddToPlaylistPanel({ lessonId }: AddToPlaylistPanelProps) {
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void schoolApi.playlists.list({ mine: true, limit: 50 }).then((res) => {
      if (!active) return;
      setLoading(false);
      if (res.ok) setPlaylists(res.value.playlists);
      else setError(res.error.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const addTo = (playlistId: string) => {
    setError(null);
    void schoolApi.playlists.addItem(playlistId, lessonId).then((res) => {
      if (res.ok) setAddedIds((prev) => new Set(prev).add(playlistId));
      else setError(res.error.message);
    });
  };

  const createAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError(null);
    setCreating(true);
    void schoolApi.playlists.create({ title: newTitle.trim() }).then((cres) => {
      if (!cres.ok) {
        setCreating(false);
        setError(cres.error.message);
        return;
      }
      const playlist = cres.value.playlist;
      void schoolApi.playlists.addItem(playlist.id, lessonId).then((ares) => {
        setCreating(false);
        setNewTitle("");
        setPlaylists((prev) => [{ ...playlist, itemCount: 0, firstLesson: null }, ...(prev ?? [])]);
        if (ares.ok) setAddedIds((prev) => new Set(prev).add(playlist.id));
        else setError(ares.error.message);
      });
    });
  };

  return (
    <div>
      {loading ? <p className="px-2 py-1.5 text-text-sm text-grey-400">Loading…</p> : null}

      {playlists !== null ? (
        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
          {playlists.length === 0 ? (
            <p className="px-2 py-1.5 text-text-sm text-grey-400">
              You don&apos;t have any playlists yet.
            </p>
          ) : (
            playlists.map((p) => {
              const added = addedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addTo(p.id)}
                  disabled={added}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-text-sm font-medium text-grey-200 transition-colors hover:bg-white/8 disabled:cursor-default"
                >
                  <span className="truncate">{p.title}</span>
                  <span className={added ? "text-aster-teal-300" : "text-grey-500"}>
                    {added ? "Added" : "+"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}

      <form onSubmit={createAndAdd} className="mt-2 flex gap-1.5 border-t border-white/8 pt-2.5">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New playlist name"
          maxLength={200}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-full bg-grey-900/60 px-3 py-1.5 text-text-sm text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
        />
        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="shrink-0 rounded-full bg-brand-gradient px-3 py-1.5 text-text-sm font-semibold text-grey-950 disabled:opacity-50"
        >
          {creating ? "…" : "Create"}
        </button>
      </form>

      {error ? <p className="mt-1.5 px-2 text-text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
