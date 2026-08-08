"use client";

import { useEffect, useState } from "react";
import type { LessonSummary } from "@/shared";
import { youtubeThumbnail } from "../lib/youtube";
import { schoolApi } from "../state/school-api";

interface AddVideoModalProps {
  playlistId: string;
  /** Lesson ids already in the playlist — shown as "Added" instead of a button. */
  existingLessonIds: Set<string>;
  onAdded: (lessonId: string) => void;
  onClose: () => void;
}

/** Modal to search existing video lessons and add one to this playlist. */
export function AddVideoModal({
  playlistId,
  existingLessonIds,
  onAdded,
  onClose,
}: AddVideoModalProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const handle = setTimeout(() => {
      setLoading(true);
      void schoolApi.list({ types: ["video"], q: q.trim() || undefined, limit: 20 }).then((res) => {
        if (!active) return;
        setLoading(false);
        if (res.ok) {
          setError(null);
          setResults(res.value.lessons);
        } else {
          setError(res.error.message);
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [q]);

  const addVideo = (lessonId: string) => {
    setAddingId(lessonId);
    void schoolApi.playlists.addItem(playlistId, lessonId).then((res) => {
      setAddingId(null);
      if (res.ok) onAdded(lessonId);
      else setError(res.error.message);
    });
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-16 flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-grey-gradient p-5 shadow-2xl ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-text-lg font-semibold text-grey-50">Add video</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-grey-400 hover:bg-white/8 hover:text-grey-100"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search video titles…"
          className="w-full rounded-full bg-grey-900/60 px-4 py-2.5 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
        />

        {error ? <p className="text-text-sm text-red-400">{error}</p> : null}

        <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
          {loading ? (
            <p className="py-4 text-center text-text-sm text-grey-400">Loading…</p>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-text-sm text-grey-400">No video lessons found.</p>
          ) : (
            results.map((lesson) => {
              const thumbnail = lesson.videoUrl ? youtubeThumbnail(lesson.videoUrl) : null;
              const added = existingLessonIds.has(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-white/5"
                >
                  <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-grey-800">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external thumbnail
                      <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-text-sm font-semibold leading-snug text-grey-100">
                      {lesson.title}
                    </p>
                    <p className="text-[11px] text-grey-500">
                      {lesson.videoAuthor ?? lesson.authorName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addVideo(lesson.id)}
                    disabled={added || addingId === lesson.id}
                    className="shrink-0 rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 hover:bg-white/8 disabled:cursor-default disabled:opacity-50"
                  >
                    {added ? "Added" : addingId === lesson.id ? "…" : "Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
