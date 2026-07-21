import Link from "next/link";
import type { LessonSummary } from "@/shared";
import { CommentIcon, HeartIcon } from "./icons";
import { LessonOptionsMenu } from "./LessonOptionsMenu";
import { LessonTypeBadge } from "./LessonTypeBadge";

interface LessonCardProps {
  lesson: LessonSummary;
  currentUserId: string | null;
  onDeleted: (lessonId: string) => void;
}

/** An article/PDF row in the feed's document list — links to the full lesson. */
export function LessonCard({ lesson, currentUserId, onDeleted }: LessonCardProps) {
  const isOwner = currentUserId !== null && currentUserId === lesson.authorId;
  const [firstTag, ...restTags] = lesson.tags;

  return (
    <div className="group relative flex flex-col gap-1.5 px-5 py-3 transition-colors hover:bg-white/[0.03]">
      <Link
        href={`/school/${lesson.id}`}
        aria-label={lesson.title}
        className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aster-teal-400"
      />

      <h2 className="truncate text-text-lg font-medium text-grey-100 group-hover:text-grey-50">{lesson.title}</h2>

      <div className="flex items-center gap-4 text-text-sm text-grey-500">
        <span className="shrink-0">
          <LessonTypeBadge type={lesson.type} />
        </span>

        <p className="min-w-0 flex-1 truncate text-grey-400">{lesson.summary ?? ""}</p>

        <span className="w-28 shrink-0 truncate">{lesson.authorName}</span>

        {firstTag ? (
          <span className="shrink-0 truncate rounded-full bg-aster-teal-500/12 px-2 py-0.5 text-[11px] font-semibold text-aster-teal-300">
            #{firstTag}
            {restTags.length > 0 ? ` +${restTags.length}` : ""}
          </span>
        ) : null}

        <span className="hidden shrink-0 items-center gap-3 md:inline-flex">
          <span className="inline-flex items-center gap-1">
            <HeartIcon className="text-grey-600" /> {lesson.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <CommentIcon className="text-grey-600" /> {lesson.commentCount}
          </span>
        </span>

        {isOwner ? (
          <span className="relative z-10 shrink-0">
            <LessonOptionsMenu lessonId={lesson.id} onDeleted={onDeleted} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
