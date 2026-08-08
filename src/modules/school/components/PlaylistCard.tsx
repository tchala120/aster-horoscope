import Link from "next/link";
import type { PlaylistSummary } from "@/shared";
import { formatRelativeTime } from "@/foundation/ui/format";
import { youtubeThumbnail } from "../lib/youtube";
import { PlayIcon } from "./icons";

interface PlaylistCardProps {
  playlist: PlaylistSummary;
}

/** A playlist card: cover thumbnail from the first video, title, item count, author. */
export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const thumbnail =
    playlist.coverImageUrl ??
    (playlist.firstLesson?.videoUrl ? youtubeThumbnail(playlist.firstLesson.videoUrl) : null);
  const href = `/school/playlists/${playlist.id}`;

  return (
    <Link href={href} className="group flex flex-col gap-3 focus:outline-none">
      <span className="relative block aspect-video w-full overflow-hidden rounded-xl bg-grey-800 ring-1 ring-white/8 group-focus-visible:ring-2 group-focus-visible:ring-aster-teal-400">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- external thumbnail, no local optimization needed
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayIcon className="h-10 w-10 text-white" />
        </span>
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white">
          {playlist.itemCount} {playlist.itemCount === 1 ? "video" : "videos"}
        </span>
      </span>

      <div>
        <h2 className="line-clamp-2 text-text-md font-semibold leading-snug text-grey-100 group-hover:text-grey-50">
          {playlist.title}
        </h2>
        <p className="mt-1 truncate text-text-sm text-grey-400">
          {playlist.authorName} · {formatRelativeTime(playlist.createdAt)}
        </p>
      </div>
    </Link>
  );
}
