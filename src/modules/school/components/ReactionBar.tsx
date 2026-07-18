"use client";

import { useState } from "react";
import type { ReactionType, ReactionsResponse } from "@/shared";
import { schoolApi } from "../state/school-api";
import { BookmarkIcon, HeartIcon } from "./icons";

interface ReactionBarProps {
  lessonId: string;
  likeCount: number;
  bookmarkCount: number;
  yourReactions: ReactionType[];
}

/** Like / bookmark toggles for a lesson. Reflects server counts after each toggle. */
export function ReactionBar({ lessonId, likeCount, bookmarkCount, yourReactions }: ReactionBarProps) {
  const [state, setState] = useState<ReactionsResponse>({ likeCount, bookmarkCount, yourReactions });
  const [pending, setPending] = useState<ReactionType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (type: ReactionType) => {
    setPending(type);
    void schoolApi.toggleReaction(lessonId, type).then((res) => {
      setPending(null);
      if (res.ok) {
        setState(res.value);
        setMessage(null);
      } else if (res.error.status === 401) {
        setMessage("Log in to react.");
      } else {
        setMessage(res.error.message);
      }
    });
  };

  const liked = state.yourReactions.includes("like");
  const bookmarked = state.yourReactions.includes("bookmark");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => toggle("like")}
        disabled={pending === "like"}
        aria-pressed={liked}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-text-sm font-semibold ring-1 ring-white/12 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        style={
          liked
            ? { color: "#ff6f9c", backgroundColor: "rgba(255,90,138,0.16)", boxShadow: "inset 0 0 0 1px rgba(255,90,138,0.5)" }
            : { color: "#cbd0d8" }
        }
      >
        <HeartIcon filled={liked} /> {state.likeCount}
        <span className="text-grey-400">Like</span>
      </button>

      <button
        type="button"
        onClick={() => toggle("bookmark")}
        disabled={pending === "bookmark"}
        aria-pressed={bookmarked}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-text-sm font-semibold ring-1 ring-white/12 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        style={
          bookmarked
            ? { color: "#66bfe2", backgroundColor: "rgba(51,161,204,0.16)", boxShadow: "inset 0 0 0 1px rgba(51,161,204,0.5)" }
            : { color: "#cbd0d8" }
        }
      >
        <BookmarkIcon filled={bookmarked} /> {state.bookmarkCount}
        <span className="text-grey-400">Bookmark</span>
      </button>

      {message ? <span className="text-text-sm text-grey-400">{message}</span> : null}
    </div>
  );
}
