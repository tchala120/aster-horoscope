import type { LessonType } from "@/shared";

const STYLES: Record<LessonType, { color: string; background: string; label: string }> = {
  article: { color: "#5fe0c4", background: "rgba(51,204,173,0.14)", label: "Article" },
  pdf: { color: "#ff9a62", background: "rgba(255,122,31,0.14)", label: "PDF" },
  video: { color: "#c4b5fd", background: "rgba(139,92,246,0.16)", label: "Video" },
};

/** A small pill indicating whether a lesson is a written article, a PDF, or a video. */
export function LessonTypeBadge({ type }: { type: LessonType }) {
  const { color, background, label } = STYLES[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color, backgroundColor: background }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
