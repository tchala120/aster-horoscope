"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppError, LessonResponse, LessonType } from "@/shared";
import type { Result } from "@/foundation/ui/result";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { PdfUploader } from "./components/PdfUploader";
import { RichTextEditor } from "./components/RichTextEditor";
import { TagInput } from "./components/TagInput";
import { VideoLinkCard } from "./components/VideoLinkCard";
import { schoolApi } from "./state/school-api";

type Props = { mode: "create" } | { mode: "edit"; id: string };

type Load =
  | { status: "loading" }
  | { status: "unauth" }
  | { status: "forbidden" }
  | { status: "notfound" }
  | { status: "ready" };

// A light client-side check just to gate the live preview; the server re-validates on submit.
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const labelClass = "text-text-sm font-semibold text-grey-300";
const inputClass =
  "w-full rounded-xl bg-grey-900/60 px-4 py-2.5 text-text-md text-grey-100 ring-1 ring-white/10 placeholder:text-grey-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400";

/** Create or edit a lesson — Write (markdown) or Upload PDF (create only). */
export function LessonEditor(props: Props) {
  const router = useRouter();
  const editId = props.mode === "edit" ? props.id : null;
  const editing = editId !== null;

  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [type, setType] = useState<LessonType>("article");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAuthor, setVideoAuthor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void schoolApi.session().then((sres) => {
      if (!active) return;
      if (!sres.ok) {
        setLoad({ status: "unauth" });
        return;
      }
      const uid = sres.value.session.userId;
      if (!editId) {
        setLoad({ status: "ready" });
        return;
      }
      void schoolApi.get(editId).then((lres) => {
        if (!active) return;
        if (!lres.ok) {
          setLoad({ status: lres.error.status === 404 ? "notfound" : "ready" });
          return;
        }
        const l = lres.value.lesson;
        if (l.authorId !== uid) {
          setLoad({ status: "forbidden" });
          return;
        }
        setType(l.type);
        setTitle(l.title);
        setSummary(l.summary ?? "");
        setContent(l.content ?? "");
        setVideoUrl(l.videoUrl ?? "");
        setVideoAuthor(l.videoAuthor ?? "");
        setTags(l.tags);
        setLoad({ status: "ready" });
      });
    });
    return () => {
      active = false;
    };
  }, [editId]);

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.set("file", file);
    const res = await schoolApi.uploadImage(form);
    if (!res.ok) throw new Error(res.error.message);
    return res.value.url;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (type === "article" && !content.trim()) {
      setError("Content is required.");
      return;
    }
    if (type === "video" && !videoUrl.trim()) {
      setError("Add a YouTube link.");
      return;
    }
    if (!editing && type === "pdf" && !file) {
      setError("Choose a PDF to upload.");
      return;
    }

    const done = (res: Result<LessonResponse, AppError>) => {
      setSubmitting(false);
      if (res.ok) router.push(`/school/${editId ?? res.value.lesson.id}`);
      else setError(res.error.message);
    };

    setSubmitting(true);
    const trimmedSummary = summary.trim() || undefined;

    if (editing) {
      void schoolApi
        .update(editId, {
          title: title.trim(),
          summary: trimmedSummary,
          content,
          videoUrl,
          videoAuthor: videoAuthor.trim(),
          tags,
        })
        .then(done);
    } else if (type === "article") {
      void schoolApi
        .createArticle({ title: title.trim(), summary: trimmedSummary, content, tags })
        .then(done);
    } else if (type === "video") {
      void schoolApi
        .createVideo({
          title: title.trim(),
          summary: trimmedSummary,
          videoUrl: videoUrl.trim(),
          videoAuthor: videoAuthor.trim(),
          tags,
        })
        .then(done);
    } else {
      const form = new FormData();
      form.set("title", title.trim());
      if (trimmedSummary) form.set("summary", trimmedSummary);
      form.set("tags", JSON.stringify(tags));
      form.set("file", file as File);
      void schoolApi.createPdf(form).then(done);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-6">
        <BackLink />

        {load.status === "loading" && <p className="text-grey-400">Loading…</p>}

        {load.status === "unauth" && (
          <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
            <p className="text-text-lg font-semibold text-grey-100">Log in to write a lesson</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Go to login
            </Link>
          </div>
        )}

        {load.status === "forbidden" && (
          <p className="text-text-md text-grey-300">You can only edit your own lessons.</p>
        )}
        {load.status === "notfound" && <p className="text-text-md text-grey-300">Lesson not found.</p>}

        {load.status === "ready" && (
          <form onSubmit={submit} className="flex flex-col gap-5">
            <h1 className="text-heading-lg font-bold text-grey-50">
              {editing ? "Edit lesson" : "New lesson"}
            </h1>

            {/* Type tabs (create only) */}
            {!editing && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("article")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-text-md font-semibold transition-colors ${
                    type === "article"
                      ? "bg-brand-gradient text-grey-950"
                      : "bg-grey-900/60 text-grey-200 ring-1 ring-white/10 hover:bg-grey-800/70"
                  }`}
                >
                  Write article
                </button>
                <button
                  type="button"
                  onClick={() => setType("pdf")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-text-md font-semibold transition-colors ${
                    type === "pdf"
                      ? "bg-brand-gradient text-grey-950"
                      : "bg-grey-900/60 text-grey-200 ring-1 ring-white/10 hover:bg-grey-800/70"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setType("video")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-text-md font-semibold transition-colors ${
                    type === "video"
                      ? "bg-brand-gradient text-grey-950"
                      : "bg-grey-900/60 text-grey-200 ring-1 ring-white/10 hover:bg-grey-800/70"
                  }`}
                >
                  Video link
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lesson-title" className={labelClass}>
                Title
              </label>
              <input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="A clear, descriptive title"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lesson-summary" className={labelClass}>
                Summary <span className="font-normal text-grey-500">(optional)</span>
              </label>
              <input
                id="lesson-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={500}
                placeholder="One line that describes this lesson"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Tags</span>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {type === "article" ? (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Content</span>
                <RichTextEditor value={content} onChange={setContent} onUploadImage={uploadImage} />
              </div>
            ) : type === "video" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lesson-video-url" className={labelClass}>
                    YouTube link
                  </label>
                  <input
                    id="lesson-video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lesson-video-author" className={labelClass}>
                    Author <span className="font-normal text-grey-500">(auto-filled, edit if you like)</span>
                  </label>
                  <input
                    id="lesson-video-author"
                    value={videoAuthor}
                    onChange={(e) => setVideoAuthor(e.target.value)}
                    maxLength={100}
                    placeholder="Channel or creator name"
                    className={inputClass}
                  />
                </div>

                {YOUTUBE_RE.test(videoUrl.trim()) ? (
                  <VideoLinkCard
                    key={videoUrl.trim()}
                    url={videoUrl.trim()}
                    onAuthor={(author) => setVideoAuthor((prev) => (prev.trim() ? prev : author))}
                  />
                ) : null}
              </>
            ) : editing ? (
              <p className="rounded-xl bg-grey-900/40 px-4 py-3 text-text-sm text-grey-400 ring-1 ring-white/8">
                The PDF file can&apos;t be replaced here. To swap the document, delete this lesson and
                upload a new one.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>PDF document</span>
                <PdfUploader file={file} onSelect={setFile} />
              </div>
            )}

            {error ? <p className="text-text-md text-red-400">{error}</p> : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-gradient px-8 py-3 text-text-md font-semibold text-grey-950 transition-transform enabled:hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {submitting ? "Saving…" : editing ? "Save changes" : "Publish"}
              </button>
              <Link href="/school" className="text-text-md font-semibold text-grey-400 hover:text-grey-200">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
