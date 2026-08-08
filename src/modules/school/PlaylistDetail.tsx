"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlaylistItem } from "@/shared";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { formatDate } from "@/foundation/ui/format";
import { AddVideoModal } from "./components/AddVideoModal";
import { VideoPlayer } from "./components/VideoPlayer";
import { youtubeThumbnail } from "./lib/youtube";
import { schoolApi } from "./state/school-api";

type State =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      title: string;
      description: string | null;
      coverImageUrl: string | null;
      authorId: string;
      authorName: string;
      items: PlaylistItem[];
    };

/** A curated playlist: a queue player (auto-advances on end) plus the ordered item list. */
export function PlaylistDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [userId, setUserId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);

  useEffect(() => {
    let active = true;
    void schoolApi.playlists.get(id).then((res) => {
      if (!active) return;
      if (res.ok) {
        setState({
          status: "ready",
          title: res.value.playlist.title,
          description: res.value.playlist.description,
          coverImageUrl: res.value.playlist.coverImageUrl,
          authorId: res.value.playlist.authorId,
          authorName: res.value.playlist.authorName,
          items: res.value.items,
        });
      } else if (res.error.status === 404) {
        setState({ status: "notfound" });
      } else {
        setState({ status: "error", message: res.error.message });
      }
    });
    void schoolApi.session().then((res) => {
      if (active && res.ok) setUserId(res.value.session.userId);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status !== "ready") {
    return (
      <main className="relative flex flex-1 flex-col">
        <CelestialBackground />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 p-6">
          <BackLink href="/school/playlists" />
          {state.status === "loading" && <p className="text-grey-400">Loading…</p>}
          {state.status === "notfound" && (
            <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
              <p className="text-text-lg font-semibold text-grey-100">Playlist not found</p>
              <Link
                href="/school/playlists"
                className="mt-4 inline-block text-text-md font-semibold text-aster-sky-300 hover:underline"
              >
                Back to playlists
              </Link>
            </div>
          )}
          {state.status === "error" && <p className="text-text-md text-red-400">{state.message}</p>}
        </div>
      </main>
    );
  }

  const { title, description, coverImageUrl, authorId, authorName, items } = state;
  const isOwner = userId !== null && userId === authorId;
  const clampedIndex = Math.min(index, Math.max(items.length - 1, 0));
  const current = items[clampedIndex];

  const setItems = (items: PlaylistItem[]) =>
    setState((s) => (s.status === "ready" ? { ...s, items } : s));

  const onVideoAdded = () => {
    void schoolApi.playlists.get(id).then((res) => {
      if (res.ok) setItems(res.value.items);
    });
  };

  const onEnded = () => {
    if (clampedIndex < items.length - 1) setIndex(clampedIndex + 1);
  };

  const onRemove = (lessonId: string) => {
    setBusyLessonId(lessonId);
    void schoolApi.playlists.removeItem(id, lessonId).then((res) => {
      setBusyLessonId(null);
      if (res.ok) setItems(res.value.items);
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next); // optimistic
    void schoolApi.playlists
      .reorder(
        id,
        next.map((i) => i.lesson.id),
      )
      .then((res) => {
        if (res.ok) setItems(res.value.items);
      });
  };

  const onDelete = () => {
    setDeleting(true);
    void schoolApi.playlists.remove(id).then((res) => {
      if (res.ok) router.push("/school/playlists");
      else setDeleting(false);
    });
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 p-6">
        <BackLink href="/school/playlists" />

        <header className="flex flex-col gap-2">
          <div className="flex items-start gap-4">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded asset, no local optimization needed
              <img
                src={coverImageUrl}
                alt=""
                className="aspect-video w-32 shrink-0 rounded-xl object-cover ring-1 ring-white/10 sm:w-40"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-heading-lg font-bold text-grey-50">{title}</h1>
                {isOwner ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVideo(true)}
                      className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 hover:bg-white/8"
                    >
                      + Add video
                    </button>
                    <Link
                      href={`/school/playlists/${id}/edit`}
                      className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 hover:bg-white/8"
                    >
                      Edit
                    </Link>
                    {confirmingDelete ? (
                      <>
                        <button
                          type="button"
                          onClick={onDelete}
                          disabled={deleting}
                          className="rounded-full bg-red-500/90 px-3 py-1.5 text-text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {deleting ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(false)}
                          className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/15 hover:bg-white/8"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/15 hover:bg-white/8 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              <p className="text-text-sm text-grey-400">
                by {authorName} · {items.length} {items.length === 1 ? "video" : "videos"}
              </p>
              {description ? <p className="text-text-md text-grey-300">{description}</p> : null}
            </div>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">No videos yet</p>
            <p className="mt-1 text-text-md text-grey-400">
              {isOwner
                ? "Add an existing video lesson to get this playlist started."
                : "The creator hasn't added any videos yet."}
            </p>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setShowAddVideo(true)}
                className="mt-5 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
              >
                + Add video
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-3">
              <VideoPlayer
                key={current.lesson.id}
                url={current.lesson.videoUrl ?? ""}
                onEnded={onEnded}
              />
              <div>
                <h2 className="text-text-lg font-semibold text-grey-50">{current.lesson.title}</h2>
                <p className="text-text-sm text-grey-400">
                  {current.lesson.videoAuthor ?? current.lesson.authorName}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item, i) => {
                const thumbnail = item.lesson.videoUrl
                  ? youtubeThumbnail(item.lesson.videoUrl)
                  : null;
                const active = i === clampedIndex;
                return (
                  <div
                    key={item.id}
                    className={`flex gap-2.5 rounded-xl p-2 ring-1 transition-colors ${
                      active
                        ? "bg-white/10 ring-aster-teal-400/50"
                        : "ring-transparent hover:bg-white/5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus:outline-none"
                    >
                      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-grey-800">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element -- external thumbnail
                          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`line-clamp-2 block text-text-sm font-semibold leading-snug ${
                            active ? "text-grey-50" : "text-grey-200"
                          }`}
                        >
                          {item.lesson.title}
                        </span>
                        <span className="text-[11px] text-grey-500">
                          {formatDate(item.lesson.createdAt)}
                        </span>
                      </span>
                    </button>

                    {isOwner ? (
                      <div className="flex shrink-0 flex-col items-center justify-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Move up"
                          onClick={() => move(i, i - 1)}
                          disabled={i === 0}
                          className="text-grey-400 hover:text-grey-100 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          onClick={() => move(i, i + 1)}
                          disabled={i === items.length - 1}
                          className="text-grey-400 hover:text-grey-100 disabled:opacity-30"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          aria-label="Remove from playlist"
                          onClick={() => onRemove(item.lesson.id)}
                          disabled={busyLessonId === item.lesson.id}
                          className="mt-1 text-[11px] font-semibold text-grey-500 hover:text-red-400 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAddVideo ? (
        <AddVideoModal
          playlistId={id}
          existingLessonIds={new Set(items.map((i) => i.lesson.id))}
          onAdded={onVideoAdded}
          onClose={() => setShowAddVideo(false)}
        />
      ) : null}
    </main>
  );
}
