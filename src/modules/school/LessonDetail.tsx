"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LessonSummary, ReactionType } from "@/shared";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { formatDate } from "@/foundation/ui/format";
import { CommentSection } from "./components/CommentSection";
import { LessonTypeBadge } from "./components/LessonTypeBadge";
import { MarkdownView } from "./components/MarkdownView";
import { PdfViewer } from "./components/PdfViewer";
import { ReactionBar } from "./components/ReactionBar";
import { VideoLinkCard } from "./components/VideoLinkCard";
import { schoolApi } from "./state/school-api";

type State =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error"; message: string }
  | { status: "ready"; lesson: LessonSummary; yourReactions: ReactionType[] };

/** Full lesson view: article body or PDF, reactions, and comments. */
export function LessonDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [userId, setUserId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    void schoolApi.get(id).then((res) => {
      if (!active) return;
      if (res.ok) {
        setState({ status: "ready", lesson: res.value.lesson, yourReactions: res.value.yourReactions });
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

  const onDelete = () => {
    setDeleting(true);
    void schoolApi.remove(id).then((res) => {
      if (res.ok) router.push("/school");
      else setDeleting(false);
    });
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-6">
        <BackLink />

        {state.status === "loading" && <p className="text-grey-400">Loading…</p>}

        {state.status === "notfound" && (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">Lesson not found</p>
            <Link href="/school" className="mt-4 inline-block text-text-md font-semibold text-aster-sky-300 hover:underline">
              Back to Aster School
            </Link>
          </div>
        )}

        {state.status === "error" && <p className="text-text-md text-red-400">{state.message}</p>}

        {state.status === "ready" &&
          (() => {
            const { lesson, yourReactions } = state;
            const isOwner = userId !== null && userId === lesson.authorId;
            return (
              <>
                <header className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <LessonTypeBadge type={lesson.type} />
                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/school/${lesson.id}/edit`}
                          className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-200 ring-1 ring-white/15 hover:bg-white/8"
                        >
                          Edit
                        </Link>
                        {confirming ? (
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
                              onClick={() => setConfirming(false)}
                              className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/15 hover:bg-white/8"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/15 hover:bg-white/8 hover:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <h1 className="text-heading-lg font-bold text-grey-50">{lesson.title}</h1>
                  <p className="text-text-sm text-grey-400">
                    by {lesson.authorName} · {formatDate(lesson.createdAt)}
                    {lesson.tags.length ? " · " : ""}
                    {lesson.tags.map((t) => (
                      <span key={t} className="text-grey-500">
                        {" "}
                        #{t}
                      </span>
                    ))}
                  </p>
                  {lesson.summary ? <p className="text-text-md text-grey-300">{lesson.summary}</p> : null}
                </header>

                <ReactionBar
                  lessonId={lesson.id}
                  likeCount={lesson.likeCount}
                  bookmarkCount={lesson.bookmarkCount}
                  yourReactions={yourReactions}
                />

                {lesson.type === "pdf" ? (
                  <PdfViewer
                    src={`/api/v1/school/lessons/${lesson.id}/file`}
                    fileName={lesson.pdfFileName ?? "document.pdf"}
                  />
                ) : lesson.type === "video" ? (
                  <VideoLinkCard key={lesson.videoUrl} url={lesson.videoUrl ?? ""} />
                ) : (
                  <article className="rounded-2xl bg-grey-900/40 p-5 ring-1 ring-white/8 sm:p-6">
                    <MarkdownView>{lesson.content ?? ""}</MarkdownView>
                  </article>
                )}

                <CommentSection lessonId={lesson.id} currentUserId={userId} />
              </>
            );
          })()}
      </div>
    </main>
  );
}
