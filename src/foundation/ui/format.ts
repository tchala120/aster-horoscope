/** Format an ISO timestamp as a short, locale-aware date (e.g. "Jun 15, 2026"). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a count compactly (e.g. 1.6B, 3.4M, 12K) for space-constrained UI like view counts. */
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Format seconds as a video duration badge, YouTube-style (e.g. "5:03", "1:02:03"). */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** Format an ISO timestamp as relative time (e.g. "2 days ago") for compact metadata rows. */
export function formatRelativeTime(iso: string): string {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSec) >= secondsInUnit) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        Math.round(diffSec / secondsInUnit),
        unit,
      );
    }
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(diffSec / 60), "minute");
}
