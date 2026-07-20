import Link from "next/link";
import type { LessonSummary } from "@/shared";
import { formatCompactNumber, formatDuration, formatRelativeTime } from "@/foundation/ui/format";
import { LessonOptionsMenu } from "./LessonOptionsMenu";
import { youtubeThumbnail } from "../lib/youtube";

const AVATAR_COLORS = ["#33cca4", "#33a1cc", "#7c4dff", "#ff7a1f", "#ff5c7a", "#5fe0c4"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface VideoCardProps {
  lesson: LessonSummary;
  currentUserId: string | null;
  onDeleted: (lessonId: string) => void;
}

/** A YouTube-style video card: thumbnail with duration badge, channel avatar, title, channel, views · time. */
export function VideoCard({ lesson, currentUserId, onDeleted }: VideoCardProps) {
  const thumbnail = lesson.videoUrl ? youtubeThumbnail(lesson.videoUrl) : null;
  const channel = lesson.videoAuthor ?? lesson.authorName;
  const isOwner = currentUserId !== null && currentUserId === lesson.authorId;
  const href = `/school/${lesson.id}`;

  return (
    <div className="group flex flex-col gap-3">
      {/* Decorative — the title link below carries the accessible name, so keyboard/
          screen-reader users don't hit the same destination announced twice. */}
      <Link href={href} tabIndex={-1} aria-hidden className="block">
        <span className="relative aspect-video w-full overflow-hidden rounded-xl bg-grey-800">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- external thumbnail, no local optimization needed
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : null}
          {lesson.videoDurationSeconds != null ? (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {formatDuration(lesson.videoDurationSeconds)}
            </span>
          ) : null}
        </span>
      </Link>

      <div className="flex gap-2.5">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-grey-950"
          style={{ backgroundColor: avatarColor(channel) }}
        >
          {channel.slice(0, 1).toUpperCase()}
        </span>

        <Link
          href={href}
          className="min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
        >
          <h2 className="line-clamp-2 text-text-md font-semibold leading-snug text-grey-100 group-hover:text-grey-50">
            {lesson.title}
          </h2>
          <p className="mt-1 truncate text-text-sm">
            {lesson.videoAuthor ? (
              <span className="font-semibold text-aster-sky-300">{lesson.videoAuthor}</span>
            ) : (
              <span className="text-grey-400">{lesson.authorName}</span>
            )}
          </p>
          <p className="text-text-sm text-grey-500">
            {lesson.videoViews != null ? `${formatCompactNumber(lesson.videoViews)} views · ` : ""}
            {formatRelativeTime(lesson.createdAt)}
          </p>
          {lesson.tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lesson.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-aster-teal-500/12 px-2 py-0.5 text-[11px] font-semibold text-aster-teal-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </Link>

        {isOwner ? (
          <div className="shrink-0">
            <LessonOptionsMenu lessonId={lesson.id} onDeleted={onDeleted} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
