"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { PROSE_CLASSNAME } from "./prose-styles";

const IMAGE_MAX_MB = 4;
const IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp";

interface RichTextEditorProps {
  value: string;
  onChange: (v: string) => void;
  /** Uploads an image and resolves to its URL; rejecting shows the error inline. Omit to hide the image button. */
  onUploadImage?: (file: File) => Promise<string>;
}

const btnClass =
  "rounded-md px-2.5 py-1.5 text-text-sm font-semibold text-grey-100 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 aria-pressed:bg-white/20 aria-pressed:text-aster-teal-300";

/**
 * True WYSIWYG lesson editor (TipTap): bold text looks bold, images render
 * inline, no Markdown syntax is ever visible while writing — matches Medium.
 * Select text and a floating toolbar pops up above it to format. Content is
 * still stored as Markdown under the hood (via tiptap-markdown) so the rest
 * of the app — storage, MarkdownView — is unaffected.
 */
export function RichTextEditor({ value, onChange, onUploadImage }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder: "Start writing here…" }),
      Markdown.configure({ html: false }),
    ],
    content: value,
    editorProps: {
      attributes: { class: `${PROSE_CLASSNAME} tiptap min-h-[16rem] px-4 py-3 focus:outline-none` },
    },
    onUpdate: ({ editor: e }) => {
      const markdown = e.storage.markdown.getMarkdown();
      lastEmitted.current = markdown;
      onChange(markdown);
    },
  });

  // Sync external `value` changes (e.g. loading an existing lesson) into the
  // editor, but skip echoes of our own onUpdate — comparing against the raw
  // markdown-serializer round-trip would spuriously reset the cursor mid-type.
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageFile = async (file: File) => {
    if (!onUploadImage || !editor) return;
    setUploadError(null);
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setUploadError(`Images must be ${IMAGE_MAX_MB} MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      const alt = file.name.replace(/\.[^.]+$/, "");
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Prevent the toolbar from stealing focus (which would collapse the
  // selection before the button's onClick applies formatting to it).
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  if (!editor) {
    return <div className="min-h-[16rem] rounded-xl bg-grey-900/40 ring-1 ring-white/10" />;
  }

  return (
    <div className="rounded-xl bg-grey-900/40 ring-1 ring-white/10">
      {onUploadImage ? (
        <div className="flex items-center justify-end gap-1 border-b border-white/10 px-2 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_TYPES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleImageFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full px-3 py-1.5 text-text-sm font-semibold text-grey-300 ring-1 ring-white/12 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "🖼️ Add image"}
          </button>
        </div>
      ) : null}

      {uploadError ? (
        <p className="border-b border-white/10 px-4 py-2 text-text-sm text-red-400">{uploadError}</p>
      ) : null}

      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-lg bg-grey-950 px-1.5 py-1 shadow-2xl ring-1 ring-white/10"
      >
        <button
          type="button"
          title="Bold"
          aria-pressed={editor.isActive("bold")}
          className={`${btnClass} font-bold`}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          title="Italic"
          aria-pressed={editor.isActive("italic")}
          className={`${btnClass} italic`}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          title="Link"
          aria-pressed={editor.isActive("link")}
          className={btnClass}
          onMouseDown={keepFocus}
          onClick={setLink}
        >
          🔗
        </button>
        <span className="mx-0.5 h-5 w-px bg-white/15" aria-hidden />
        <button
          type="button"
          title="Heading"
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className={btnClass}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H
        </button>
        <button
          type="button"
          title="Quote"
          aria-pressed={editor.isActive("blockquote")}
          className={btnClass}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;
        </button>
        <button
          type="button"
          title="Bulleted list"
          aria-pressed={editor.isActive("bulletList")}
          className={btnClass}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </button>
        <button
          type="button"
          title="Numbered list"
          aria-pressed={editor.isActive("orderedList")}
          className={btnClass}
          onMouseDown={keepFocus}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <p className="border-t border-white/10 px-4 py-2 text-[11px] text-grey-500">
        Select text to change formatting, add headers, or create links.
      </p>
    </div>
  );
}
