import { youtubeEmbedUrl } from "../lib/youtube";

interface VideoPlayerProps {
  url: string;
}

/** Inline, fullscreen-capable YouTube player for a lesson's video. */
export function VideoPlayer({ url }: VideoPlayerProps) {
  const embedUrl = youtubeEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center rounded-xl bg-grey-900/40 text-text-md font-semibold text-aster-sky-300 ring-1 ring-white/10 hover:underline"
      >
        Watch on YouTube
      </a>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      <iframe
        src={embedUrl}
        title="Lesson video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
