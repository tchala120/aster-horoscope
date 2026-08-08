"use client";

import { useRef, useState } from "react";
import { schoolApi } from "../state/school-api";

interface PlaylistCoverUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

const MAX_MB = 4;

/** Click/drag image picker for a playlist cover — uploads immediately and stores the resulting URL. */
export function PlaylistCoverUploader({ value, onChange }: PlaylistCoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Images must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.set("file", f);
    void schoolApi.uploadImage(form).then((res) => {
      setUploading(false);
      if (res.ok) onChange(res.value.url);
      else setError(res.error.message);
    });
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
        className={`relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
          dragging
            ? "border-aster-teal-400 bg-aster-teal-500/10"
            : "border-white/15 bg-grey-900/40 hover:bg-grey-900/60"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded asset, no local optimization needed
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <p className="text-text-md font-semibold text-grey-200">
              Drop an image here, or click to choose
            </p>
            <p className="text-text-sm text-grey-500">Max {MAX_MB} MB</p>
          </>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-text-sm font-semibold text-grey-100">
            Uploading…
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 text-text-sm font-semibold text-grey-400 hover:text-red-400"
        >
          Remove cover image
        </button>
      ) : null}
      {error ? <p className="mt-2 text-text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
