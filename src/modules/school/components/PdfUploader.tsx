"use client";

import { useRef, useState } from "react";

interface PdfUploaderProps {
  file: File | null;
  onSelect: (file: File | null) => void;
  maxMb?: number;
}

/** Drag-and-drop / click PDF picker with client-side type + size checks. */
export function PdfUploader({ file, onSelect, maxMb = 4 }: PdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (f: File | null | undefined) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      setError(`The PDF must be ${maxMb} MB or smaller.`);
      return;
    }
    setError(null);
    onSelect(f);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
          dragging
            ? "border-aster-teal-400 bg-aster-teal-500/10"
            : "border-white/15 bg-grey-900/40 hover:bg-grey-900/60"
        }`}
      >
        {file ? (
          <>
            <p className="text-text-md font-semibold text-grey-100">{file.name}</p>
            <p className="text-text-sm text-grey-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB — click to replace
            </p>
          </>
        ) : (
          <>
            <p className="text-text-md font-semibold text-grey-200">Drop a PDF here, or click to choose</p>
            <p className="text-text-sm text-grey-500">Max {maxMb} MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
