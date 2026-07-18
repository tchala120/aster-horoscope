import Link from "next/link";
import type { LessonSummary, LessonType } from "@/shared";
import { formatCompactNumber, formatDate } from "@/foundation/ui/format";
import { CommentIcon, HeartIcon, PlayIcon } from "./icons";
import { youtubeThumbnail } from "../lib/youtube";

const TYPE_LABEL: Record<LessonType, string> = { article: "Article", pdf: "PDF", video: "Video" };

/** A lesson row in the feed's document list — links to the full lesson. */
export function LessonCard({ lesson }: { lesson: LessonSummary }) {
  const thumbnail = lesson.type === "video" && lesson.videoUrl ? youtubeThumbnail(lesson.videoUrl) : null;

  return (
    <Link
      href={`/school/${lesson.id}`}
      className="group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aster-teal-400 sm:flex-row sm:items-baseline sm:gap-5"
    >
      <div className="flex shrink-0 items-baseline gap-3 sm:w-32">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-grey-500">
          {TYPE_LABEL[lesson.type]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          {thumbnail ? (
            <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-grey-800 sm:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail, no local optimization needed */}
              <img src={thumbnail} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                <PlayIcon className="h-6 w-6 text-white drop-shadow" />
              </span>
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-text-lg font-medium text-grey-100 group-hover:text-grey-50">{lesson.title}</h2>
              <span className="shrink-0 text-text-sm tabular-nums text-grey-500">
                {formatDate(lesson.createdAt)}
              </span>
            </div>

            {lesson.type === "video" && (lesson.videoAuthor || lesson.videoViews != null) ? (
              <p className="mt-1 text-text-sm text-grey-400">
                {lesson.videoAuthor ? (
                  <span className="font-semibold text-aster-sky-300">{lesson.videoAuthor}</span>
                ) : null}
                {lesson.videoAuthor && lesson.videoViews != null ? " · " : ""}
                {lesson.videoViews != null ? `${formatCompactNumber(lesson.videoViews)} views` : ""}
              </p>
            ) : null}

            {lesson.summary ? (
              <p className="mt-1 line-clamp-1 text-text-sm text-grey-400">{lesson.summary}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-text-sm text-grey-500">
          <span className="truncate">{lesson.authorName}</span>
          {lesson.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-aster-teal-500/12 px-2 py-0.5 text-[11px] font-semibold text-aster-teal-300"
            >
              #{t}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-3 text-grey-500">
            <span className="inline-flex items-center gap-1">
              <HeartIcon className="text-grey-600" /> {lesson.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <CommentIcon className="text-grey-600" /> {lesson.commentCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
