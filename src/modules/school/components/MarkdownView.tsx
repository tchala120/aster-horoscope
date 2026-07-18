"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PROSE_CLASSNAME } from "./prose-styles";

/**
 * Renders lesson markdown. react-markdown does not emit raw HTML by default, so
 * user content can't inject scripts — no extra sanitization needed. Elements are
 * styled via arbitrary variants (no typography plugin dependency).
 */
export function MarkdownView({ children }: { children: string }) {
  return (
    <div className={PROSE_CLASSNAME}>
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  );
}
