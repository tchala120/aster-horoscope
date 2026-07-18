"use client";

import { useEffect, useRef, useState } from "react";

interface PdfViewerProps {
  src: string;
  fileName: string;
}

/** Renders every page of a lesson's PDF full-width and stacked, Medium-style — no browser toolbar or nested scroll frame. */
export function PdfViewer({ src, fileName }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let loadingTask: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;
    container.replaceChildren();
    setLoading(true);
    setError(null);

    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      loadingTask = pdfjsLib.getDocument({ url: src });
      const doc = await loadingTask.promise;
      if (cancelled) return;

      const width = container.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let i = 1; i <= doc.numPages; i++) {
        if (cancelled) break;
        const page = await doc.getPage(i);
        const unscaled = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / unscaled.width) * dpr });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "block w-full";

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (cancelled) break;

        container.appendChild(canvas);
        setLoading(false);
      }
    })()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load this PDF.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [src]);

  return (
    <div className="overflow-hidden rounded-xl bg-grey-800 ring-1 ring-white/10">
      {loading && (
        <div className="flex h-[60vh] items-center justify-center text-text-sm text-grey-400">Loading document…</div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-text-sm text-red-400">
          <p>{error}</p>
        </div>
      )}
      <div ref={containerRef} className="flex flex-col gap-2" />
      <div className="flex items-center justify-between gap-3 bg-grey-900/70 px-4 py-2.5 text-text-sm text-grey-300">
        <span className="truncate">{fileName}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-semibold text-aster-sky-300 hover:underline"
        >
          Open in new tab ↗
        </a>
      </div>
    </div>
  );
}
