import Link from "next/link";
import type { LessonSummary, LessonType } from "@/shared";
import { formatDate } from "@/foundation/ui/format";
import { CommentIcon, HeartIcon } from "./icons";
import { LessonOptionsMenu } from "./LessonOptionsMenu";

const TYPE_LABEL: Record<LessonType, string> = { article: "Article", pdf: "PDF", video: "Video" };

interface LessonCardProps {
  lesson: LessonSummary;
  currentUserId: string | null;
  onDeleted: (lessonId: string) => void;
}

/** An article/PDF row in the feed's document list — links to the full lesson. */
export function LessonCard({ lesson, currentUserId, onDeleted }: LessonCardProps) {
  const isOwner = currentUserId !== null && currentUserId === lesson.authorId;

  return (
    <div className="group relative flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-baseline sm:gap-5">
      <Link
        href={`/school/${lesson.id}`}
        aria-label={lesson.title}
        className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aster-teal-400"
      />

      <div className="flex shrink-0 items-baseline gap-3 sm:w-32">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-grey-500">
          {TYPE_LABEL[lesson.type]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-text-lg font-medium text-grey-100 group-hover:text-grey-50">{lesson.title}</h2>
          <span className="shrink-0 text-text-sm tabular-nums text-grey-500">{formatDate(lesson.createdAt)}</span>
        </div>

        {lesson.summary ? <p className="mt-1 line-clamp-1 text-text-sm text-grey-400">{lesson.summary}</p> : null}

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
            {isOwner ? (
              <span className="relative z-10">
                <LessonOptionsMenu lessonId={lesson.id} onDeleted={onDeleted} />
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
