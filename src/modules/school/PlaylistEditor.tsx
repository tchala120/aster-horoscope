"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { PlaylistCoverUploader } from "./components/PlaylistCoverUploader";
import { schoolApi } from "./state/school-api";

type Props = { mode: "create" } | { mode: "edit"; id: string };

type Load =
  | { status: "loading" }
  | { status: "unauth" }
  | { status: "forbidden" }
  | { status: "notfound" }
  | { status: "ready" };

const labelClass = "text-text-sm font-semibold text-grey-300";
const inputClass =
  "w-full rounded-xl bg-grey-900/60 px-4 py-2.5 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400";

/** Create or edit a playlist's title/description. Items are managed on the playlist's own page. */
export function PlaylistEditor(props: Props) {
  const router = useRouter();
  const editId = props.mode === "edit" ? props.id : null;
  const editing = editId !== null;

  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void schoolApi.session().then((sres) => {
      if (!active) return;
      if (!sres.ok) {
        setLoad({ status: "unauth" });
        return;
      }
      const uid = sres.value.session.userId;
      if (!editId) {
        setLoad({ status: "ready" });
        return;
      }
      void schoolApi.playlists.get(editId).then((pres) => {
        if (!active) return;
        if (!pres.ok) {
          setLoad({ status: pres.error.status === 404 ? "notfound" : "ready" });
          return;
        }
        const p = pres.value.playlist;
        if (p.authorId !== uid) {
          setLoad({ status: "forbidden" });
          return;
        }
        setTitle(p.title);
        setDescription(p.description ?? "");
        setCoverImageUrl(p.coverImageUrl);
        setLoad({ status: "ready" });
      });
    });
    return () => {
      active = false;
    };
  }, [editId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    const input = {
      title: title.trim(),
      description: description.trim() || undefined,
      coverImageUrl: coverImageUrl ?? undefined,
    };
    const call = editing
      ? schoolApi.playlists.update(editId, input)
      : schoolApi.playlists.create(input);
    void call.then((res) => {
      setSubmitting(false);
      if (res.ok) router.push(`/school/playlists/${editId ?? res.value.playlist.id}`);
      else setError(res.error.message);
    });
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-6">
        <BackLink href="/school/playlists" />

        {load.status === "loading" && <p className="text-grey-400">Loading…</p>}

        {load.status === "unauth" && (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">Log in to create a playlist</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Go to login
            </Link>
          </div>
        )}

        {load.status === "forbidden" && (
          <p className="text-text-md text-grey-300">You can only edit your own playlists.</p>
        )}
        {load.status === "notfound" && (
          <p className="text-text-md text-grey-300">Playlist not found.</p>
        )}

        {load.status === "ready" && (
          <form onSubmit={submit} className="flex flex-col gap-5">
            <h1 className="text-heading-lg font-bold text-grey-50">
              {editing ? "Edit playlist" : "New playlist"}
            </h1>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Cover image <span className="font-normal text-grey-500">(optional)</span>
              </span>
              <PlaylistCoverUploader value={coverImageUrl} onChange={setCoverImageUrl} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="playlist-title" className={labelClass}>
                Title
              </label>
              <input
                id="playlist-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Beginner Astrology Series"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="playlist-description" className={labelClass}>
                Description <span className="font-normal text-grey-500">(optional)</span>
              </label>
              <textarea
                id="playlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What's this series about?"
                className={inputClass}
              />
            </div>

            {!editing ? (
              <p className="rounded-xl bg-grey-900/40 px-4 py-3 text-text-sm text-grey-400 ring-1 ring-white/8">
                Add videos to the playlist from its page after creating it.
              </p>
            ) : null}

            {error ? <p className="text-text-md text-red-400">{error}</p> : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform enabled:hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {submitting ? "Saving…" : editing ? "Save changes" : "Create playlist"}
              </button>
              <Link
                href="/school/playlists"
                className="text-text-md font-semibold text-grey-400 hover:text-grey-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
