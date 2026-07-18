"use client";

import { useEffect, useState } from "react";
import type { LessonComment } from "@/shared";
import { formatDate } from "@/foundation/ui/format";
import { schoolApi } from "../state/school-api";

interface CommentSectionProps {
  lessonId: string;
  /** The viewer's user id (null when not logged in) — enables deleting own comments. */
  currentUserId: string | null;
}

/** Comment list + composer for a lesson. */
export function CommentSection({ lessonId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void schoolApi.comments(lessonId).then((res) => {
      if (!active) return;
      setLoading(false);
      if (res.ok) setComments(res.value.comments);
    });
    return () => {
      active = false;
    };
  }, [lessonId]);

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    void schoolApi.addComment(lessonId, text).then((res) => {
      setPosting(false);
      if (res.ok) {
        setComments(res.value.comments);
        setBody("");
        setMessage(null);
      } else if (res.error.status === 401) {
        setMessage("Log in to comment.");
      } else {
        setMessage(res.error.message);
      }
    });
  };

  const remove = (id: string) => {
    void schoolApi.deleteComment(id).then((res) => {
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    });
  };

  return (
    <section className="mt-8">
      <h2 className="text-heading-sm font-bold text-grey-50">
        Comments{comments.length ? ` (${comments.length})` : ""}
      </h2>

      <form onSubmit={post} className="mt-4 flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-xl bg-grey-900/60 px-4 py-3 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="rounded-full bg-brand-gradient px-6 py-2 text-text-md font-semibold text-grey-950 transition-transform enabled:hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {posting ? "Posting…" : "Post"}
          </button>
          {message ? <span className="text-text-sm text-grey-400">{message}</span> : null}
        </div>
      </form>

      {loading ? (
        <p className="mt-4 text-text-sm text-grey-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-text-sm text-grey-500">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-grey-900/50 px-4 py-3 ring-1 ring-white/8">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-text-sm font-semibold text-grey-100">{c.authorName}</span>
                <span className="text-[11px] text-grey-500">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-text-sm text-grey-300">{c.body}</p>
              {currentUserId === c.authorId ? (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="mt-2 text-[11px] font-semibold text-grey-500 hover:text-red-400 focus:outline-none focus-visible:text-red-400"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
