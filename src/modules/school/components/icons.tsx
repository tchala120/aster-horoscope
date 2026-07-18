/** Small inline icons for Aster School (like / bookmark / comment). */

export function HeartIcon({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className} aria-hidden>
      <path
        d="M10 16.5S3 12.4 3 7.9A3.4 3.4 0 0 1 10 6a3.4 3.4 0 0 1 7 1.9c0 4.5-7 8.6-7 8.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookmarkIcon({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className} aria-hidden>
      <path
        d="M5.5 3.5h9a1 1 0 0 1 1 1V17l-5.5-3-5.5 3V4.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3.5 3v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M6.5 4.7c0-.9 1-1.5 1.8-1L15 8.2c.8.5.8 1.7 0 2.2l-6.7 4.5c-.8.5-1.8-.1-1.8-1V4.7Z" />
    </svg>
  );
}

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M18 6.4a2.3 2.3 0 0 0-1.6-1.6C14.9 4.4 10 4.4 10 4.4s-4.9 0-6.4.4A2.3 2.3 0 0 0 2 6.4 24 24 0 0 0 1.6 10a24 24 0 0 0 .4 3.6 2.3 2.3 0 0 0 1.6 1.6c1.5.4 6.4.4 6.4.4s4.9 0 6.4-.4a2.3 2.3 0 0 0 1.6-1.6A24 24 0 0 0 18.4 10a24 24 0 0 0-.4-3.6ZM8.3 12.6V7.4l4.3 2.6-4.3 2.6Z" />
    </svg>
  );
}
