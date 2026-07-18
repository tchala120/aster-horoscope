"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon, YouTubeIcon } from "./icons";

interface OEmbed {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

interface VideoLinkCardProps {
  url: string;
  /** Called once the channel name resolves — e.g. to auto-fill an author field. */
  onAuthor?: (author: string) => void;
}

/**
 * Open-Graph-style preview for a YouTube link — click through to watch on YouTube.
 * Render with `key={url}` at the call site so a new link starts from a clean loading state.
 */
export function VideoLinkCard({ url, onAuthor }: VideoLinkCardProps) {
  const [meta, setMeta] = useState<OEmbed | null>(null);
  const [failed, setFailed] = useState(false);
  const onAuthorRef = useRef(onAuthor);
  useEffect(() => {
    onAuthorRef.current = onAuthor;
  }, [onAuthor]);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? (res.json() as Promise<OEmbed>) : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        if (data.author_name) onAuthorRef.current?.(data.author_name);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl bg-grey-900/40 ring-1 ring-white/10 transition-colors hover:bg-grey-900/60 sm:flex-row"
    >
      <div className="relative aspect-video shrink-0 bg-grey-800 sm:w-72">
        {meta ? (
          // eslint-disable-next-line @next/next/no-img-element -- external thumbnail, no local optimization needed
          <img src={meta.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white transition-transform group-hover:scale-110">
            <PlayIcon />
          </span>
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
        <p className="line-clamp-2 text-text-md font-semibold text-grey-100">
          {meta?.title ?? (failed ? "Watch on YouTube" : "Loading…")}
        </p>
        {meta?.author_name ? <p className="text-text-sm text-grey-400">{meta.author_name}</p> : null}
        <p className="mt-1 inline-flex items-center gap-1.5 text-text-sm font-semibold text-aster-sky-300">
          <YouTubeIcon /> youtube.com
        </p>
      </div>
    </a>
  );
}
