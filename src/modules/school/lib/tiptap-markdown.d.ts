// tiptap-markdown doesn't ship a `@tiptap/core` Storage augmentation, so
// `editor.storage.markdown` is untyped without this.
import "@tiptap/core";
import type { MarkdownStorage } from "tiptap-markdown";

declare module "@tiptap/core" {
  interface Storage {
    markdown: MarkdownStorage;
  }
}
