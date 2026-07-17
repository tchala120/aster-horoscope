"use client";

import { useEffect, useRef, useState } from "react";

interface AmbientMusicProps {
  /** Track to loop, e.g. "/sound/loffy.mp3". */
  src: string;
  /** Playback volume 0–1 (default 0.45). */
  volume?: number;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {muted ? (
        <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
      ) : (
        <>
          <path d="M16 8.75a4 4 0 0 1 0 6.5" />
          <path d="M18.5 6.5a7 7 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

/**
 * Looping background music with a mute/resume toggle. Attempts to autoplay;
 * if the browser blocks it, playback starts on the visitor's first interaction.
 * Loops forever (restarts when the track ends). Audio stops when unmounted.
 */
export function AmbientMusic({ src, volume = 0.45 }: AmbientMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    const begin = () => {
      if (startedRef.current) return;
      void audio
        .play()
        .then(() => {
          startedRef.current = true;
          setPlaying(true);
        })
        .catch(() => {
          /* autoplay blocked — wait for a user gesture */
        });
    };

    begin(); // optimistic autoplay
    window.addEventListener("pointerdown", begin);
    window.addEventListener("keydown", begin);

    return () => {
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src, volume]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    startedRef.current = true; // take manual control; stop auto-start on outside clicks
    if (audio.paused) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={playing ? "Pause music" : "Play music"}
      aria-pressed={playing}
      title={playing ? "Pause music" : "Play music"}
      className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-grey-900/70 text-grey-200 ring-1 ring-white/12 backdrop-blur transition-colors hover:bg-grey-800/80 hover:text-grey-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
    >
      <SpeakerIcon muted={!playing} />
    </button>
  );
}
