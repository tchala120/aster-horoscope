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
