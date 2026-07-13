"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** ISO timestamp of the target moment (e.g. next daily reset). */
  targetIso: string;
  onComplete?: () => void;
}

function format(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Presentational live countdown. Parent supplies the target time. */
export function Countdown({ targetIso, onComplete }: CountdownProps) {
  const target = new Date(targetIso).getTime();
  // Start null so server and first client render match (avoids hydration mismatch).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Establish the client clock after mount (SSR renders a placeholder, so this
    // is the intended post-hydration sync — not a cascading-render smell).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : target - now;

  useEffect(() => {
    if (remaining !== null && remaining <= 0) onComplete?.();
  }, [remaining, onComplete]);

  return (
    <time
      dateTime={targetIso}
      aria-label="Time until next draw"
      className="font-mono text-heading-sm tabular-nums text-aster-sky-300"
    >
      {remaining === null ? "--:--:--" : format(remaining)}
    </time>
  );
}
