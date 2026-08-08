import { useEffect, useId, useRef } from "react";
import { youtubeEmbedUrl } from "../lib/youtube";

interface VideoPlayerProps {
  url: string;
  /** Called once playback crosses the watched threshold (or ends). */
  onWatched?: () => void;
  /** Called when playback reaches the end — used to auto-advance a playlist queue. */
  onEnded?: () => void;
}

/** Fraction of the video that must be watched before it counts as "watched". */
const WATCHED_THRESHOLD = 0.8;

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTPlayerStateChangeEvent {
  data: number;
}

interface YTNamespace {
  Player: new (
    elementId: string,
    options: { events: { onStateChange: (e: YTPlayerStateChangeEvent) => void } },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<YTNamespace> | null = null;

/** Loads the YouTube IFrame Player API script once per page (shared across players). */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiLoadPromise) {
    apiLoadPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiLoadPromise;
}

/** Inline, fullscreen-capable YouTube player for a lesson's video. */
export function VideoPlayer({ url, onWatched, onEnded }: VideoPlayerProps) {
  const embedUrl = youtubeEmbedUrl(url);
  const domId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const watchedRef = useRef(false);

  useEffect(() => {
    watchedRef.current = false;
  }, [url]);

  useEffect(() => {
    if (!embedUrl || (!onWatched && !onEnded)) return;
    let player: YTPlayer | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const markWatched = () => {
      if (watchedRef.current) return;
      watchedRef.current = true;
      onWatched?.();
    };

    void loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(domId, {
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              markWatched();
              onEnded?.();
            } else if (e.data === YT.PlayerState.PLAYING && !interval) {
              interval = setInterval(() => {
                if (!player || watchedRef.current) return;
                const duration = player.getDuration();
                const current = player.getCurrentTime();
                if (duration > 0 && current / duration >= WATCHED_THRESHOLD) markWatched();
              }, 3000);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      player?.destroy();
    };
  }, [embedUrl, domId, onWatched, onEnded]);

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
        id={domId}
        src={`${embedUrl}?enablejsapi=1`}
        title="Lesson video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
